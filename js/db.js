// Database functions are here as promises

let dbInstance = null;

const DB_NAME = "symptom_database";
const DB_VERSION = 1;



/*
    symptom {
        key: "bodyache"
        name: "Body ache"
        max: 10
        active: true
    }
*/


export function getDB() {
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Symptoms
            if(!db.objectStoreNames.contains("symptoms")){
                db.createObjectStore("symptoms", { keyPath: "key"});
            }

            if(!db.objectStoreNames.contains("dailies")){
                db.createObjectStore("dailies", {keyPath: "date"});
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        }

        request.onerror = () => {
            reject(request.error);
        }
    });
}

export async function getAllSymptoms() {
    const db = await getDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction("symptoms", "readonly");
        const store = tx.objectStore("symptoms");
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

    });
}

export async function getActiveSymptoms() {
    const symptoms = await getAllSymptoms();

    return symptoms.filter(s => s.active);
}

export async function getSymptomByKey(key){
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("symptoms");
        const store = tx.objectStore("symptoms");
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result);
        }

        request.onerror = () => {
            reject(request.error);
        }
    });
}

function normaliseName(name){
    return name.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

export async function updateSymptom(name, max, active){
    const db = await getDB();

    console.log(`Updating ${name}: Active: ${active?"yes":"no"}`);

    const key = normaliseName(name);
    const symptom = {"key": key, "name": name, "max": max, "active": active};

    return new Promise((resolve, reject) => {
        const tx = db.transaction("symptoms", "readwrite");
        const store = tx.objectStore("symptoms");
        const request = store.put(symptom);

        request.onsuccess = () => {
            resolve(request.result);
        }

        request.onerror = () => {
            reject(request.error);
        }
    });
}

export async function addSymptom(name, max){
    await updateSymptom(name, max, true);
}

export async function activateSymptom(key){
    const symptom = await getSymptomByKey(key);

    await updateSymptom(symptom.name, symptom.max, true);
}
export async function deactivateSymptom(key){
    const symptom = await getSymptomByKey(key);

    await updateSymptom(symptom.name, symptom.max, false);
}





export async function getAllDailies() {
    const db = await getDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction("dailies", "readonly");
        const store = tx.objectStore("dailies");
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function getDailyByDate(date) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("dailies", "readonly");
        const store = tx.objectStore("dailies");
        const request = store.get(date);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export function getScoreFromDaily(daily){
    let total = 0;
    let num = 0;
    for (const s in daily.symptoms) {
        total += parseInt(daily.symptoms[s]);
        num += 1;
    }
    let average = (total / num);

    return [total, average];
}

export async function getDailyScoreByDate(date) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("dailies", "readonly");
        const store = tx.objectStore("dailies");
        const request = store.get(date);

        request.onsuccess = () => {
            resolve(getScoreFromDaily(request.result));
        }

        request.onerror = () => {
            reject(request.error);
        }

    });
}

export async function updateDaily(date, symptoms, note){
    const db = await getDB();

    const daily = {"date": date, "note": note, "symptoms": symptoms};

    return new Promise((resolve, reject) => {
        const tx = db.transaction("dailies", "readwrite");
        const store = tx.objectStore("dailies");
        const request = store.put(daily);

        request.onsuccess = () => {
            resolve(request.result);
        }

        request.onerror = () => {
            reject(request.error);
        }
    });
}


async function exportDatabase() {
    const db = await getDB();

    const data = {
        "app": "SymptomTracker",
        "version": 1,
        "data": {

        }
    };

    for (const storeName of db.objectStoreNames) {
        console.log(storeName);
        data.data[storeName] = await new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    return data;
}

export async function importDatabase(data) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(
            [
                "symptoms",
                "dailies"
            ],
            "readwrite"
        );

        const symptoms = tx.objectStore("symptoms");
        const dailies = tx.objectStore("dailies");

        symptoms.clear();
        dailies.clear();

        data.symptoms.forEach(symptom => {
            symptoms.put(symptom);
        });
        data.dailies.forEach(daily => {
            dailies.put(daily);
        });

        tx.oncomplete = () => {
            resolve(true);
        }

        tx.onerror = () => {
            reject(tx.error);
        }

        tx.onabort = () => {
            reject(
                new Error("Import aborted. Database unchanged.")
            );
        }
    });
}


export async function downloadDB() {
    const backup = await exportDatabase();

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }        
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `symptom-tracker-backup.json`
    a.click();

    URL.revokeObjectURL(url);
}

// TODO: Check each element before importing
function validateBackup(backup) {
    if(!backup || typeof backup !== "object"){
        throw new Error("Backup is not a valid object.");
    }
    if(backup.app !== "SymptomTracker") {
        throw new Error("This is not a SymptomTracker backup.");
    }
    if(backup.version !== 1) {
        throw new Error(`Unsupported backup version ${backup.version}.`);
    }
    if(!backup.data) {
        throw new Error("Backup contains no data.");
    }

    const requiredStores = [
        "symptoms",
        "dailies"
    ];

    for (const store of requiredStores) {
        if(!Array.isArray(backup.data[store])) {
            throw new Error(`Missing store '${store}'.`);
        }
    }
}

export async function uploadDB(fileInput) {

    const file = fileInput.files[0];
    if(!file){
        throw new Error("No file provided.");
    }

    const text = await file.text();

    const backup = JSON.parse(text);

    // Check the data is valid before confirmation
    validateBackup(backup);
    //throw new Error("This error is a test.");
    
    return backup;
}