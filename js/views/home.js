import { getActiveSymptoms, getDailyByDate, updateDaily } from "../db.js";

function dateToString(date){
    const year = (date.getYear()+1900).toString();
    const month = (date.getMonth()+1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const datestring = `${year}-${month}-${day}`;
    
    return datestring;
}

export async function showHome() {


    document.querySelector("#app").innerHTML = `
    <section class="page">
        <form id="daily-form" class="fill">
            <fieldset id="daily-fieldset" class="grow">
                <legend>Rate your daily symptoms</legend>
                <input type="date" id="daily-date" required></input>
                <section id="symptom-inputs" class="stack"></section>
                <label for="daily-note">Note:</label>
                <textarea id="daily-note" rows="4" placeholder="Short extra note for today..."></textarea>
                <button type="submit">Submit</button>
            </fieldset>
        </form>
    </section>
    `;

    const form = document.querySelector("#daily-form");
    const field = document.querySelector("#daily-fieldset");
    const dateSelector = document.querySelector("#daily-date");
    const inputs = document.querySelector("#symptom-inputs");
    const noteInput = document.querySelector("#daily-note");


    async function renderSymptomInputs(date){

        inputs.textContent = "";

        const existingDaily = await getDailyByDate(date);

        if(activeSymptoms.length < 1){
            inputs.innerHTML = `<p class="center, fill">No symptoms active! Try adding/activating some symptoms on the Symptoms page.</p>`
        }

        activeSymptoms.forEach(symptom => {
            const element = document.createElement("p");
            element.setAttribute("class", "symptom-row");

            const label = document.createElement("label");
            label.setAttribute("class", "symptom-label");
            label.setAttribute("for", symptom.key);
            label.textContent = `${symptom.name}: `;

            let placeholder = 0;
            if(existingDaily && existingDaily.symptoms[symptom.key]){
                placeholder = existingDaily.symptoms[symptom.key];
            }


            const input = document.createElement("input");
            input.setAttribute("class", "symptom-input");
            input.setAttribute("id", `${symptom.key}`);
            input.setAttribute("type", "number");
            input.setAttribute("min", "0");
            input.setAttribute("placeholder", `${placeholder}`);
            input.setAttribute("value", `${placeholder}`);
            input.setAttribute("required", "");
            if(symptom.max != 0){
                input.setAttribute("max", `${symptom.max}`);
            }

            element.appendChild(label);
            element.appendChild(input);
            inputs.appendChild(element);
        });

        // Note
        if(existingDaily){
            noteInput.value = existingDaily.note;
        } else {
            noteInput.value = "";
        }
    }

    // Generate a list of inputs
    let activeSymptoms = await getActiveSymptoms();
    

    
    // Create a date selector
    dateSelector.setAttribute("value", dateToString(new Date(Date.now())));
    

    dateSelector.addEventListener("change", (event)=> {
        console.log("Change Event.");
        renderSymptomInputs(dateSelector.value);
    });

    if(activeSymptoms.length === 0){
        // Some kind of error handling
        // "No symptoms active"
        inputs.textContent="No symptoms active! Go to the symptoms tab to create or activate some.";
    }
    renderSymptomInputs(dateSelector.value);


    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Create daily
        let symptoms = {};

        activeSymptoms.forEach(symptom => {
            const input = document.querySelector(`#${symptom.key}`);
            if(!input){ console.error(`Could not find: ${symptom.key}`) }
            
            // Add to the list of symptoms
            symptoms[`${symptom.key}`] = input.value;
            
        });

        // Update the daily
        await updateDaily(dateSelector.value, symptoms, noteInput.value);
    });

    

    


}