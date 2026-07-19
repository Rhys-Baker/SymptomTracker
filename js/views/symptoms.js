import { getAllSymptoms, addSymptom, updateSymptom, deactivateSymptom, activateSymptom } from "../db.js";


export async function showSymptoms() {
    document.querySelector("#app").innerHTML = `
    <section class="page">
        <form id="symptom-form">
            <fieldset>
                <legend>Add a symptom</legend>
                <div class="stack">
                    <input
                        id="symptom-name"
                        type="text"
                        placeholder="Symptom"
                        required
                    >
                    <input
                        id="symptom-max"
                        type="number"
                        min="0"
                        placeholder="10"
                        required
                    >
                    <button type="submit" >
                        Add
                    </button>
                </div>
            </fieldset>
        </form>
    
        <ul id="symptom-list"></ul>
    </section>
    `


    const form = document.querySelector("#symptom-form");
    const symptomName = document.querySelector("#symptom-name");
    const symptomMax  = document.querySelector("#symptom-max");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = symptomName.value.trim();
        const max = symptomMax.value;

        if(!name) {
            return;
        }
        if(!max){
            return;
        }
        
        await addSymptom(name, max);


        symptomName.value = "";
        symptomMax.value = "";

        renderSymptoms();
    });

    renderSymptoms();
}

async function renderSymptoms() {
    const symptoms = await getAllSymptoms();

    const list = document.querySelector("#symptom-list");

    list.innerHTML = "";

    symptoms.forEach(s => {
        const li = document.createElement("li");

        li.innerHTML = `
        <span>
            ${s.name} (max: ${s.max} | ${s.active ? "Active" : "Inactive"})
        </span>
        <button class="toggle-btn">
            ${s.active ? "Deactivate" : "Activate"}
        </button>
        `;

        const button = li.querySelector(".toggle-btn");

        button.addEventListener("click", async () => {
            // 
            if(s.active) {
                await deactivateSymptom(s.key);
                button.textContent = "Activate";
            } else {
                await activateSymptom(s.key);
                button.textContent = "Deactivate";
            }

            renderSymptoms();
        });

        
        list.appendChild(li);
    });
}