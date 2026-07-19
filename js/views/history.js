import { downloadDB, uploadDB, getAllDailies, importDatabase, getAllSymptoms, getSymptomByKey, getDailyScoreByDate} from "../db.js";

export async function showHistory() {

    document.querySelector("#app").innerHTML = `
    <section class="page">
        <form>
            <fieldset>
                <legend>Daily history</legend>
                <section id="history">
                </section>
            </fieldset>
            <fieldset>
                <legend>Calendar</legend>
                <section id="calendar">
                </section>
                <button id="test-btn">Test</button>
            </fieldset>
            <button id="export-btn">Export</button>
            <button id="import-btn">Import</button>
            <input type="file" id="import-file" accept=".json">
        </form>
    </section>
    `;

    const historySection = document.querySelector("#history");
    const exportButton = document.querySelector("#export-btn");
    exportButton.addEventListener("click", downloadDB);
    const importButton = document.querySelector("#import-btn");
    const fileInput = document.querySelector("#import-file");
    
    const testButton = document.querySelector("#test-btn");
    testButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const [total, average] = await getDailyScoreByDate("2026-07-17");
        alert(`Total: ${total}\nAverage: ${average}`);
    });

    importButton.addEventListener("click", async () => {
        try {
            const backup = await uploadDB(fileInput);

            if(!confirm("Are you sure you want to import this backup? Doing so will overwrite all your currently loaded data.")){
                return;
            }

            await importDatabase(backup.data);

            alert("Import successful.");
            await showHistory(); // hard-refresh the whole page

        } catch (err){
            console.error(err);
            alert(err.message);
        }
    
    });
    
    const listEl = document.createElement("ul");
    const symptoms = await getAllSymptoms();
    const dailies = await getAllDailies();
    if(!dailies){
        // TODO: No dailies. Do a message about it
        return;
    }

    dailies.forEach((daily) => {
        const itemEl = document.createElement("li");
        itemEl.textContent = `${daily.date}`;

        for(const [key, value] of Object.entries(daily.symptoms)){
            const name = symptoms.find(item => item.key === key)?.name;

            itemEl.textContent += ` | ${name}: ${value}`;
        }

        if(daily.note){
            itemEl.textContent += ` | Note: "${daily.note}"`
        }

        listEl.appendChild(itemEl);
    });

    historySection.appendChild(listEl);

}