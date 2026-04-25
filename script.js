// Navigation Logic
function showSection(sectionId) {
    // Update Active Link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });

    // Show Section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners for Nav Links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        showSection(sectionId);
    });
});

// Slider Value Sync
const sliders = ['calories', 'protein', 'fat', 'sugar', 'fiber'];
sliders.forEach(id => {
    const slider = document.getElementById(id);
    const output = document.getElementById(`val-${id}`);
    slider.oninput = function () {
        output.innerHTML = this.value;
    };
});

// --- FUZZY LOGIC SYSTEM ---

function handleSearch() {
    const input = document.getElementById('foodSearch').value.toLowerCase();
    if (!input) return;

    // Base nutritional starting point
    let nutrition = { cal: 150, prot: 5, fat: 5, sug: 2, fib: 2 };

    // Heuristic Knowledge Base (Semantic Mapping)
    const heuristics = {
        // Core Ingredients
        "nasi": { cal: 250, sug: 10 },
        "mie": { cal: 350, fat: 15 },
        "roti": { cal: 200, sug: 12 },
        "ayam": { prot: 30, fat: 15 },
        "daging": { prot: 35, fat: 25 },
        "ikan": { prot: 25, fat: 10 },
        "telur": { prot: 15, fat: 12 },
        "tahu": { prot: 12, fat: 8 },
        "tempe": { prot: 15, fat: 10 },

        // Preparation Methods
        "goreng": { fat: 35, cal: 250 },
        "santan": { fat: 40, cal: 300 },
        "bakar": { fat: 10, cal: 80 },
        "rebus": { fat: 2, cal: 30 },

        // Fruits & Vegetables
        "sayur": { fib: 15, cal: 50 },
        "buah": { fib: 12, sug: 20, cal: 80 },
        "salad": { fib: 25, prot: 10, cal: 80 },

        // Flavors & Extras
        "manis": { sug: 35, cal: 150 },
        "sirup": { sug: 45, cal: 200 },
        "pedas": { cal: 50, fat: 10 },
        "keju": { fat: 20, cal: 150, prot: 12 }
    };

    // Analyze every word in the input
    let foundMatch = false;
    for (let keyword in heuristics) {
        if (input.includes(keyword)) {
            for (let nutrient in heuristics[keyword]) {
                nutrition[nutrient] += heuristics[keyword][nutrient];
            }
            foundMatch = true;
        }
    }

    if (foundMatch) {
        // Update Sliders with capped values
        updateSliderValue('calories', Math.min(nutrition.cal, 3000));
        updateSliderValue('protein', Math.min(nutrition.prot, 200));
        updateSliderValue('fat', Math.min(nutrition.fat, 150));
        updateSliderValue('sugar', Math.min(nutrition.sug, 150));
        updateSliderValue('fiber', Math.min(nutrition.fib, 100));

        analyzeFuzzy();
    }
}

function updateSliderValue(id, value) {
    const slider = document.getElementById(id);
    const output = document.getElementById(`val-${id}`);
    if (slider && output) {
        slider.value = value;
        output.innerHTML = value;
    }
}

function analyzeFuzzy() {
    const cal = parseInt(document.getElementById('calories').value);
    const prot = parseInt(document.getElementById('protein').value);
    const fat = parseInt(document.getElementById('fat').value);
    const sug = parseInt(document.getElementById('sugar').value);
    const fib = parseInt(document.getElementById('fiber').value);

    // 1. Fuzzification (Realistic thresholds for single meals)
    const getLevel = (val, low, high) => {
        if (val <= low) return 'LOW';
        if (val >= high) return 'HIGH';
        return 'MID';
    };

    const levels = {
        cal: getLevel(cal, 1000, 1800),
        prot: getLevel(prot, 25, 45),
        fat: getLevel(fat, 20, 50),
        sug: getLevel(sug, 15, 30),
        fib: getLevel(fib, 8, 18)
    };

    let score = 0;
    let reasons = [];
    let suggestion = "";

    // 2. Rule Evaluation (Flexible and impactful)

    // Rules for "Sangat Layak"
    if (levels.fib === 'HIGH' && levels.prot === 'HIGH') {
        score += 40;
        reasons.push("Sangat baik! Tinggi protein dan serat.");
    } else if (levels.fib === 'HIGH' && levels.sug === 'LOW') {
        score += 30;
        reasons.push("Bagus, tinggi serat dan rendah gula.");
    } else if (levels.prot === 'HIGH' && levels.fat === 'LOW') {
        score += 30;
        reasons.push("Bagus, tinggi protein dan rendah lemak.");
    }

    // Rules for "Kurang Layak"
    if (levels.fat === 'HIGH' && levels.sug === 'HIGH') {
        score -= 40;
        reasons.push("Kandungan lemak dan gula terlalu tinggi.");
    } else if (levels.cal === 'HIGH' && levels.fat === 'HIGH') {
        score -= 35;
        reasons.push("Kalori dan lemak sangat tinggi.");
    }

    // Base Adjustments
    if (levels.prot === 'HIGH') score += 10;
    if (levels.fib === 'HIGH') score += 10;
    if (levels.sug === 'HIGH') score -= 15;
    if (levels.fat === 'HIGH') score -= 15;

    // Normalize score (Base 50)
    let finalScore = Math.min(Math.max(score + 50, 0), 100);

    // Result Categorization
    let category = "";
    let tagClass = "";
    if (finalScore >= 70) { // Lowered from 75 to be more responsive
        category = "Sangat Layak";
        tagClass = "tag-layak";
        suggestion = "Menu ini sangat sehat! Pertahankan pola makan bergizi seperti ini.";
    } else if (finalScore >= 40) {
        category = "Cukup Layak";
        tagClass = "tag-cukup";
        suggestion = "Menu lumayan baik, namun perhatikan porsi lemak atau gula agar lebih optimal.";
    } else {
        category = "Kurang Layak";
        tagClass = "tag-kurang";
        suggestion = "Sebaiknya cari alternatif menu yang lebih tinggi serat dan rendah lemak jenuh.";
    }

    // Display Results with a tiny "thinking" delay
    const resultCard = document.getElementById('fuzzyResult');
    resultCard.classList.remove('active'); // Reset animation

    setTimeout(() => {
        resultCard.classList.add('active');
        document.getElementById('fuzzyScore').innerText = finalScore;
        const catElement = document.getElementById('fuzzyCategory');
        catElement.innerText = category;
        catElement.className = `category-tag ${tagClass}`;

        document.getElementById('fuzzyExplanation').innerText = reasons.length > 0 ? reasons.join(" ") : "Kandungan gizi berada pada level rata-rata standar.";
        document.getElementById('fuzzySuggestion').innerText = suggestion;
    }, 300);
}

function resetFuzzy() {
    document.getElementById('fuzzyResult').classList.remove('active');
    document.getElementById('foodSearch').value = "";
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        const output = document.getElementById(`val-${id}`);
        slider.value = slider.getAttribute('value');
        output.innerHTML = slider.value;
    });
}

// --- EXPERT SYSTEM ---
function diagnoseSkin() {
    const checkboxes = document.querySelectorAll('#symptomsList input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    if (selected.length === 0) {
        alert("Silakan pilih minimal satu gejala!");
        return;
    }

    let diagnosis = "Kondisi Kulit Umum";
    let explanation = "Gejala yang Anda pilih tidak spesifik pada satu masalah tertentu.";
    let recommendation = "Gunakan pelembab ringan dan tabir surya setiap hari.";

    // Rule 1: Oily, Pores, Acne
    if (selected.includes('oily') && selected.includes('pores') && selected.includes('acne')) {
        diagnosis = "Kulit Berminyak Berjerawat (Acne-Prone Oily Skin)";
        explanation = "Produksi sebum berlebih menyumbat pori-pori yang besar, memicu pertumbuhan bakteri penyebab jerawat.";
        recommendation = "Gunakan pembersih mengandung Salicylic Acid, pelembab bebas minyak (oil-free), dan hindari menyentuh wajah.";
    }
    // Rule 2: Dry, Peeling, Stinging
    else if (selected.includes('dry') && selected.includes('peeling') && selected.includes('stinging')) {
        diagnosis = "Kulit Sangat Kering & Dehidrasi";
        explanation = "Lapisan pelindung kulit (skin barrier) melemah, menyebabkan kelembaban hilang dan kulit terasa tertarik.";
        recommendation = "Gunakan pembersih wajah yang lembut (non-soap), pelembab kaya ceramide, dan hindari eksfoliasi fisik.";
    }
    // Rule 3: Redness, Irritation, Stinging
    else if (selected.includes('redness') && selected.includes('irritation') && selected.includes('stinging')) {
        diagnosis = "Kulit Sensitif / Iritasi";
        explanation = "Kulit Anda sedang mengalami inflamasi atau reaksi terhadap produk tertentu.";
        recommendation = "Hentikan penggunaan produk aktif (retinol/AHA/BHA). Gunakan produk mengandung Centella Asiatica atau Aloe Vera.";
    }
    // Rule 4: Dull, Blackheads
    else if (selected.includes('dull') && selected.includes('blackheads')) {
        diagnosis = "Kulit Kusam dengan Penumpukan Sel Kulit Mati";
        explanation = "Komedo dan kulit kusam menandakan proses regenerasi sel kulit tidak berjalan optimal.";
        recommendation = "Lakukan eksfoliasi kimiawi 1-2 kali seminggu dengan AHA atau BHA, dan gunakan serum Vitamin C.";
    }
    // Rule 5: Acne, Blackheads
    else if (selected.includes('acne') && selected.includes('blackheads')) {
        diagnosis = "Kulit Rentan Acne (Acne-Prone)";
        explanation = "Adanya komedo (closed/open comedones) merupakan tahap awal terbentuknya jerawat.";
        recommendation = "Pastikan melakukan double cleansing dan gunakan produk non-comedogenic.";
    }

    // Display Results with delay
    const resultCard = document.getElementById('expertResult');
    resultCard.classList.remove('active');

    setTimeout(() => {
        resultCard.classList.add('active');
        document.getElementById('expertDiagnosis').innerText = diagnosis;
        document.getElementById('expertExplanation').innerText = explanation;
        document.getElementById('expertRecommendation').innerText = recommendation;

        const symptomsList = document.getElementById('detectedSymptoms');
        symptomsList.innerHTML = "";
        selected.forEach(s => {
            const li = document.createElement('li');
            li.innerText = document.querySelector(`input[value="${s}"]`).parentElement.innerText;
            symptomsList.appendChild(li);
        });
    }, 400);
}

function resetExpert() {
    document.getElementById('expertResult').classList.remove('active');
    document.querySelectorAll('#symptomsList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
}
