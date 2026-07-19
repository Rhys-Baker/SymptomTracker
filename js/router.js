import { showHome } from "./views/home.js"
import { showSymptoms } from "./views/symptoms.js"
import { showHistory } from "./views/history.js";

const routes = {
    home: showHome,
    symptoms: showSymptoms,
    history: showHistory
};

export function navigate(route) {
    routes[route]();
}

window.navigate = navigate;