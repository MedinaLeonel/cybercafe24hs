class PersistentSyncQueue {
    constructor() {
        this.dbName = 'CyberSyncDB';
        this.storeName = 'pendingOperations';
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 segundos
        this.listeners = [];
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = () => {
                this.dispatchQueueUpdate();
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async addOperation(table, operation, data, userId) {
        const op = {
            id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            table,
            operation, // 'INSERT', 'UPDATE', 'DELETE'
            data,
            userId,
            status: 'pending',
            retries: 0,
            createdAt: new Date().toISOString(),
            lastAttempt: null,
            errors: []
        };

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.add(op);

                transaction.oncomplete = () => {
                    this.dispatchQueueUpdate();
                    resolve(op.id);
                };
                transaction.onerror = () => reject(transaction.error);
            };
        });
    }

    async getPendingCount() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                try {
                    const transaction = db.transaction([this.storeName], 'readonly');
                    const store = transaction.objectStore(this.storeName);
                    const index = store.index('status');
                    const countRequest = index.count('pending');

                    countRequest.onsuccess = () => resolve(countRequest.result);
                    countRequest.onerror = () => resolve(0);
                } catch (e) {
                    resolve(0);
                }
            };
            request.onerror = () => resolve(0);
        });
    }

    async getPendingOperations() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('status');
                const statusRequest = index.getAll('pending');

                statusRequest.onsuccess = () => resolve(statusRequest.result);
                statusRequest.onerror = () => resolve([]);
            };
            request.onerror = () => resolve([]);
        });
    }

    async removeOperation(id) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.delete(id);
                transaction.oncomplete = () => resolve();
            };
        });
    }

    async incrementRetry(id, errorMsg) {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const getReq = store.get(id);

                getReq.onsuccess = () => {
                    const op = getReq.result;
                    if (op) {
                        op.retries += 1;
                        op.lastAttempt = new Date().toISOString();
                        op.errors.push(errorMsg);
                        store.put(op);
                    }
                };
                transaction.oncomplete = () => resolve();
            };
        });
    }

    async markAsFailed(id, reason) {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const getReq = store.get(id);

                getReq.onsuccess = () => {
                    const op = getReq.result;
                    if (op) {
                        op.status = 'failed';
                        op.errors.push(reason);
                        store.put(op);
                    }
                };
                transaction.oncomplete = () => {
                    this.dispatchQueueUpdate();
                    resolve();
                }
            };
        });
    }

    async processQueue(supabaseClient) {
        if (!navigator.onLine) return;

        // Notificar inicio
        this.dispatchSyncEvent(true);

        const pendingOps = await this.getPendingOperations();

        for (const op of pendingOps) {
            if (op.retries >= this.maxRetries) {
                await this.markAsFailed(op.id, 'Max retries exceeded');
                continue;
            }

            try {
                let result;

                // Supabase client call
                switch (op.operation) {
                    case 'INSERT':
                        result = await supabaseClient
                            .from(op.table)
                            .insert(op.data)
                            .select();
                        break;
                    case 'UPDATE':
                        result = await supabaseClient
                            .from(op.table)
                            .update(op.data)
                            .eq('id', op.data.id)
                            .select();
                        break;
                    case 'DELETE':
                        result = await supabaseClient
                            .from(op.table)
                            .delete()
                            .eq('id', op.data.id);
                        break;
                }

                if (result.error) {
                    throw new Error(result.error.message);
                }

                await this.removeOperation(op.id);
                console.log(`✅ Sync successful: ${op.table} ${op.operation}`);
            } catch (error) {
                await this.incrementRetry(op.id, error.message);
                console.warn(`❌ Sync failed (retry ${op.retries + 1}/${this.maxRetries}):`, error);
            }
        }

        this.dispatchQueueUpdate();
        this.dispatchSyncEvent(false);
    }

    // Notificar cambios en la cola (para UI)
    async dispatchQueueUpdate() {
        const count = await this.getPendingCount();
        /* 
         Enviamos evento custom al window
         main.js escuchará este evento
        */
        const event = new CustomEvent('cyber:queue-update', { detail: { count } });
        window.dispatchEvent(event);
    }

    dispatchSyncEvent(isSyncing) {
        const event = new CustomEvent('cyber:sync-state', { detail: { syncing: isSyncing } });
        window.dispatchEvent(event);
    }
}

window.PersistentSyncQueue = PersistentSyncQueue;
window.syncQueue = new PersistentSyncQueue();
