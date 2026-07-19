import { downloadDB, uploadDB, getAllDailies, importDatabase, getAllSymptoms, getSymptomByKey, getDailyScoreByDate, dateToString, getDailyByDate } from "../db.js";

export async function showHistory() {
    document.querySelector("#app").innerHTML = `
    <section class="page">
        <form>
            <fieldset>
                <legend>Calendar</legend>
                
                <div class="month-header">
                    <button class="month-btn" id="prev-btn">Prev</button>
                    <div class="month-label">Month Year</div>
                    <button class="month-btn" id="next-btn">Next</button>
                </div>
                <div class="calendar">
                    <div class="grid"></div>
                </div>
            </fieldset>
            <button id="export-btn">Export</button>
            <button id="import-btn">Import</button>
            <input type="file" id="import-file" accept=".json">
        </form>
        <div class="backdrop" id="backdrop"></div>
        <div class="day-details" id="day-details">
            <h3>Select a day</h3>
            <p>Tap a date to view symptoms.</p>
        </div>
    </section>
    `;

    const exportButton = document.querySelector("#export-btn");
    
    const importButton = document.querySelector("#import-btn");
    const fileInput = document.querySelector("#import-file");
    const monthLabel = document.querySelector(".month-label");
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");

    const backdrop = document.getElementById("backdrop");
    const details = document.getElementById("day-details");

    const allSymptoms = await getAllSymptoms();


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


    const now = new Date();

    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth();

    await renderCalendar(currentYear, currentMonth);

    prevButton.addEventListener("click", async (event) => {
        event.preventDefault();

        currentMonth--;
        if(currentMonth < 0){
            currentMonth = 11;
            currentYear--;
        }
        await renderCalendar(currentYear, currentMonth);
    });
    nextButton.addEventListener("click", async (event) => {
        event.preventDefault();

        currentMonth++;
        if(currentMonth > 11){
            currentMonth = 0;
            currentYear++;
        }
        await renderCalendar(currentYear, currentMonth);
    });
    

    function populateDayDetails(date, daily){
        details.innerHTML = ``;
        details.classList.add("text-select");

        const header = document.createElement("h3");
        header.textContent = date.toDateString();
        details.appendChild(header);

        const section = document.createElement("section");
        if(!daily){
            const noContentMessage = document.createElement("p");
            noContentMessage.textContent = "No content.";
            section.appendChild(noContentMessage);
            details.appendChild(section);
            return;
        }
        
        // "Symptoms:"
        const symptomsHeader = document.createElement("p");
        symptomsHeader.textContent = "Symptoms:";
        section.appendChild(symptomsHeader);
        const keys = Object.keys(daily.symptoms)

        if(keys.length === 0){
            const noSymptomsMessage = document.createElement("p");
            noSymptomsMessage.textContent = "No symptoms.";
            section.appendChild(noSymptomsMessage);
        } else {
            const list = document.createElement("ul");
            keys.forEach(key => {
                const li = document.createElement("li");
                li.textContent = `${allSymptoms.find(element => element.key === key).name}: ${daily.symptoms[key]}`
                list.appendChild(li);
            })
            section.appendChild(list);
        }

        // Add daily note if it exists
        if(daily.note !== ""){
            const noteHeader = document.createElement("p");
            noteHeader.textContent = "Note:"
            section.appendChild(noteHeader);
            const noteContent = document.createElement("p");
            noteContent.textContent = daily.note;
            section.appendChild(noteContent);
        }


        details.appendChild(section);
        return;
    }

    function showDayDetails(date, daily){
        populateDayDetails(date, daily);
        backdrop.classList.add("visible");
        details.classList.add("visible");
        
    }

    function closeDetails() {
        details.classList.remove("visible");
        backdrop.classList.remove("visible")
    }

    backdrop.addEventListener("click", closeDetails);

    async function renderCalendar(year, month){
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

        const monthName = first.toLocaleString('default', {month: 'long'});
        monthLabel.textContent = `${monthName} ${year}`;

        
        // Render 7*6 (42) cells

        // Iterate over all days on this calendar page.
        for(let i = -firstDay; i < 42-firstDay; i++){
            const cellDate = new Date(year, month, i+1);

            // Get the date key
            const cellDateKey = dateToString(cellDate);
            // Find the daily for this date.
            const daily = await getDailyByDate(cellDateKey);
            



            const cell = document.createElement("div");
            cell.className = "day";
            cell.textContent = cellDate.getDate();

            let cellColorIndex = 0;
            if(daily !== undefined){
                cellColorIndex = 1;
            }

            if(i < 0){
                cell.style.background = mutedColors[cellColorIndex];
            } else if(i >= daysInMonth){
                cell.style.background = mutedColors[cellColorIndex];
            } else {
                cell.style.background = colors[cellColorIndex];
            }

            cell.addEventListener("click", () => {
                showDayDetails(cellDate, daily);
            });
            
            grid.appendChild(cell);
        }
    }

    exportButton.addEventListener("click", async (event) => {
        event.preventDefault();
        downloadDB();
    });

    importButton.addEventListener("click", async (event) => {
        event.preventDefault();
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
            return;
        }
    
    });
    
}