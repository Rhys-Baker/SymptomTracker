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
                <p id="month-label">Month</p>
                <div class="calendar">
                    
                    <div class="months"></div>
                    <div class="grid">
                    </div>
                </div>
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


    const colors = [
        "#fff",
        "#0f0",
        "#ff0",
        "#f80",
        "#f00",
    ];
    const mutedColors = [
        "#888",
        "#080",
        "#880",
        "#840",
        "#800"
    ]

    renderCalendar(2026, 0);

    function renderCalendar(year, month){
        // Clear the grid
        const grid = document.querySelector(".grid");
        grid.innerHTML = ``;
        
        // Render the weekday names
        for(const weekday of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]){
            const wd = document.createElement("div");
            wd.className = "weekday";
            wd.textContent = weekday;
            grid.appendChild(wd);
        }
        
        
        // What is the first day of the month?
        const first = new Date(year, month, 1);
        const firstDay = first.getDay();


        const daysInMonth = new Date(year, month+1, 0).getDate();

        const monthLabel = document.getElementById("month-label");

        const monthName = first.toLocaleString('default', {month: 'long'});
        monthLabel.textContent = `${monthName} ${year}`;

        
        // Render 7*6 (42) cells

        // Iterate over all days on this calendar page.
        for(let i = -firstDay; i < 42-firstDay; i++){
            const cellDate = new Date(year, month, i+1);

            const cell = document.createElement("div");
            cell.className = "day";
            cell.textContent = cellDate.getDate();

            // Cell random value
            const cellRandomValue = Math.floor(Math.random()*colors.length);

            if(i < 0){
                cell.style.background = mutedColors[cellRandomValue];
            } else if(i >= daysInMonth){
                cell.style.background = mutedColors[cellRandomValue];
            } else {
                cell.style.background = colors[cellRandomValue];
            }            
            
            grid.appendChild(cell);
        }
    }

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