// populateKnowledge.cjs
const sqlite3 = require('sqlite3').verbose();
const { pipeline } = require('@xenova/transformers');

async function populateKnowledge() {
  console.log('🚀 Starting knowledge population...');
  
  // Open existing database
  const db = new sqlite3.Database("knowledge.db", (err) => {
    if (err) {
      console.error("❌ Error opening database:", err);
      return;
    }
    console.log("✅ Opened knowledge.db");
  });

  // Load embedding model
  console.log("🧠 Loading embedding model...");
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("✅ Embedding model loaded");

  // Prepare 50 farming entries (comprehensive knowledge base)
  const entries = [
    { title: "Tomato Watering Schedule", content: "Water tomatoes 2–3 times per week depending on soil moisture. Ensure the soil is moist but not waterlogged. Deep watering is better than frequent shallow watering.", category: "Crops", tags: "tomato, watering, irrigation" },
    { title: "Wheat Fertilizer Guidelines", content: "Apply 120:60:40 kg/ha of NPK fertilizer. Split nitrogen applications into 3 stages: basal, tillering, and panicle initiation. Use urea for nitrogen, DAP for phosphorus.", category: "Crops", tags: "wheat, fertilizer, NPK" },
    { title: "Composting Basics", content: "Mix green materials (kitchen scraps, fresh grass) with brown materials (dry leaves, straw) in 3:1 ratio. Turn pile every 2 weeks. Ready in 3–6 months. Maintain moisture like wrung-out sponge.", category: "Soil", tags: "compost, organic matter, soil" },
    { title: "Pest Control in Rice", content: "Monitor pests weekly. Use neem oil for organic control. Rotate pesticides to prevent resistance. Encourage natural predators like ladybugs. Apply pesticides only when economic threshold is reached.", category: "Pest Control", tags: "rice, pests, neem" },
    { title: "Drip Irrigation Benefits", content: "Drip irrigation saves 30–50% water and allows precise fertigation. Maintain 1.5–2 bar pressure. Suitable for vegetables, fruits, and cash crops. Reduces weed growth and disease.", category: "Irrigation", tags: "drip, irrigation, water" },
    { title: "Crop Rotation Importance", content: "Rotate crops yearly to improve soil structure, reduce pests, and maintain nutrients. Include legumes to fix nitrogen. Avoid planting same family crops consecutively.", category: "Sustainable Farming", tags: "rotation, soil, legumes" },
    { title: "Organic Pest Control", content: "Use neem oil, trap crops, and beneficial insects to control pests organically. Companion planting with marigolds repels many pests. Encourage biodiversity in farm ecosystem.", category: "Pest Control", tags: "organic, pests, neem" },
    { title: "Mulching Advantages", content: "Mulch reduces evaporation, prevents weeds, and regulates soil temperature. Use organic mulch like straw or leaves. Apply 5-10 cm thick layer around plants.", category: "Soil", tags: "mulch, soil, water conservation" },
    { title: "Seed Storage Tips", content: "Store seeds in a cool, dry place. Keep moisture below 10%. Label with variety and date. Use airtight containers to prevent pest damage. Test germination before planting.", category: "Crops", tags: "seeds, storage" },
    { title: "Fertilizer Timing", content: "Apply fertilizer based on soil test results and crop growth stage. Avoid applying before heavy rain. Split applications for better nutrient uptake and reduced losses.", category: "Soil", tags: "fertilizer, timing" },
    { title: "Potato Planting Depth", content: "Plant seed potatoes 10–15 cm deep with 30–40 cm spacing between plants. Hill soil around stems as they grow. Plant after last frost date in your area.", category: "Crops", tags: "potato, planting, spacing" },
    { title: "Cucumber Trellising", content: "Use vertical trellises to save space, improve air circulation, and reduce disease. Install 6-8 feet tall supports. Train vines weekly to prevent damage.", category: "Crops", tags: "cucumber, trellis, growth" },
    { title: "Winter Wheat Sowing Time", content: "Sow winter wheat in October–November to optimize yield and avoid frost damage. Ensure adequate soil moisture for germination. Use certified seed varieties.", category: "Crops", tags: "wheat, sowing, winter" },
    { title: "Soil Testing Frequency", content: "Test soil at least once a year to monitor pH and nutrient levels. Test in fall for spring planning. Sample from multiple locations in field for accuracy.", category: "Soil", tags: "soil, testing, pH" },
    { title: "Green Manure Benefits", content: "Grow legumes or cover crops and plow them into soil to improve fertility and organic matter. Best green manure crops include clover, vetch, and mustard.", category: "Soil", tags: "green manure, organic, fertility" },
    { title: "Irrigation Scheduling", content: "Use soil moisture sensors and weather data to plan irrigation efficiently. Water early morning to reduce evaporation. Monitor crop water stress indicators.", category: "Irrigation", tags: "water, irrigation, schedule" },
    { title: "Tomato Pruning Tips", content: "Remove suckers regularly to improve airflow, reduce disease, and increase fruit size. Prune lower leaves touching ground. Support plants with stakes or cages.", category: "Crops", tags: "tomato, pruning, maintenance" },
    { title: "Rice Transplanting Method", content: "Transplant 20–25 day old seedlings in puddled fields maintaining 2–5 cm water level. Space seedlings 20x15 cm apart. Transplant during cloudy weather to reduce stress.", category: "Crops", tags: "rice, transplanting, irrigation" },
    { title: "Nitrogen Management in Maize", content: "Split nitrogen fertilizer in 2–3 applications: basal, V6 stage, and tasseling. Use soil tests to determine exact requirements. Avoid over-application to prevent lodging.", category: "Crops", tags: "maize, nitrogen, fertilizer" },
    { title: "Weed Management Strategies", content: "Use mulching, crop rotation, and targeted herbicides to control weeds effectively. Hand weeding is most effective for small areas. Pre-emergence herbicides prevent weed germination.", category: "Pest Control", tags: "weeds, control, herbicide" },
    { title: "Integrated Pest Management", content: "Combine biological, cultural, and chemical methods. Monitor pests and apply interventions only when thresholds are reached. Use pheromone traps for monitoring.", category: "Pest Control", tags: "IPM, pests, biological" },
    { title: "Tomato Disease Prevention", content: "Rotate crops, avoid overhead watering, and use resistant varieties to prevent fungal diseases. Remove infected plants immediately. Ensure good air circulation.", category: "Pest Control", tags: "tomato, disease, prevention" },
    { title: "Vegetable Fertilizer Ratios", content: "Use NPK 10:10:10 balanced fertilizer, adjust based on soil tests and crop type. Leafy vegetables need more nitrogen, fruiting vegetables need more phosphorus and potassium.", category: "Crops", tags: "fertilizer, vegetables, NPK" },
    { title: "Potassium Importance", content: "Potassium improves root development, water uptake, and disease resistance. Deficiency causes leaf yellowing and poor fruit quality. Apply potash fertilizers as needed.", category: "Soil", tags: "potassium, soil, nutrients" },
    { title: "Compost Tea Use", content: "Spray compost tea on leaves to provide nutrients and beneficial microbes. Brew for 24-48 hours with aeration. Apply early morning or evening to avoid leaf burn.", category: "Soil", tags: "compost, foliar, microbes" },
    { title: "Harvest Timing for Wheat", content: "Harvest when grains reach 12–14% moisture content to avoid losses. Check grain hardness and color. Harvest during dry weather for best quality.", category: "Crops", tags: "wheat, harvest, timing" },
    { title: "Corn Planting Density", content: "Plant 60–75 cm between rows and 20–30 cm between plants for optimal yield. Adjust density based on variety and growing conditions. Higher density for shorter varieties.", category: "Crops", tags: "corn, spacing, planting" },
    { title: "Soybean Inoculation", content: "Treat seeds with Rhizobium inoculant to improve nitrogen fixation. Use fresh inoculant and avoid direct sunlight. Can reduce nitrogen fertilizer needs by 50%.", category: "Crops", tags: "soybean, inoculant, nitrogen" },
    { title: "Frost Protection Techniques", content: "Use covers, windbreaks, or sprinklers to protect crops from frost. Row covers can provide 2-4°C protection. Remove covers during day to prevent overheating.", category: "Weather", tags: "frost, protection, weather" },
    { title: "Rainwater Harvesting", content: "Collect and store rainwater for irrigation during dry periods. Use gutters and storage tanks. Filter water before use to remove debris and contaminants.", category: "Irrigation", tags: "water, rain, conservation" },
    { title: "Drip vs Sprinkler Irrigation", content: "Drip irrigation is more water-efficient; sprinklers are better for large fields. Drip systems have 90-95% efficiency, sprinklers 70-80%. Choose based on crop and field size.", category: "Irrigation", tags: "drip, sprinkler, irrigation" },
    { title: "Vegetable Companion Planting", content: "Plant basil with tomatoes to repel pests and enhance growth. Marigolds repel nematodes. Three sisters planting (corn, beans, squash) maximizes space and nutrients.", category: "Crops", tags: "companion planting, vegetables, pests" },
    { title: "Organic Fertilizers Options", content: "Use compost, manure, bone meal, or fish emulsion to supply nutrients. Organic fertilizers release nutrients slowly and improve soil structure. Apply 2-4 weeks before planting.", category: "Soil", tags: "organic, fertilizer, soil" },
    { title: "Greenhouse Temperature Control", content: "Use fans, shading, or heaters to maintain 20–25°C for optimal growth. Ventilation is crucial to prevent disease. Monitor temperature with min/max thermometers.", category: "Technology", tags: "greenhouse, temperature, control" },
    { title: "Soil pH Adjustment", content: "Use lime for acidic soil and sulfur/gypsum for alkaline soil to maintain pH 6–7. Apply lime in fall for spring crops. Test pH annually to monitor changes.", category: "Soil", tags: "pH, soil, adjustment" },
    { title: "Vegetable Harvest Indicators", content: "Harvest when fruits reach full size, color, and firmness. Pick regularly to encourage continued production. Harvest in cool morning hours for best quality.", category: "Crops", tags: "vegetables, harvest, timing" },
    { title: "Cover Crop Benefits", content: "Prevent erosion, improve fertility, suppress weeds, and enhance soil structure. Plant after main crop harvest. Legume cover crops add nitrogen to soil.", category: "Sustainable Farming", tags: "cover crop, soil, fertility" },
    { title: "Seed Germination Test", content: "Place 100 seeds on moist paper, count sprouted seeds to check viability. Test 2-3 weeks before planting. Replace seeds with less than 80% germination rate.", category: "Crops", tags: "seeds, germination, test" },
    { title: "Farm Record Keeping", content: "Maintain logs of planting dates, inputs, yields, and weather observations. Use digital tools or notebooks. Records help plan future seasons and track profitability.", category: "Management", tags: "records, management, farm" },
    { title: "Soil Moisture Monitoring", content: "Use tensiometers or soil probes to monitor moisture levels accurately. Check at root zone depth. Irrigate when soil moisture drops to 50% of field capacity.", category: "Irrigation", tags: "soil, moisture, monitoring" },
    { title: "Pest Identification Guide", content: "Learn to identify pests visually or using reference guides before control measures. Take photos for expert identification. Monitor pest populations weekly.", category: "Pest Control", tags: "pests, identification, guide" },
    { title: "Herbicide Application Tips", content: "Apply during calm weather, follow label instructions, and avoid drift. Use proper nozzles and pressure. Apply when weeds are young and actively growing.", category: "Pest Control", tags: "herbicide, application, safety" },
    { title: "Crop Disease Early Signs", content: "Look for leaf spots, discoloration, wilting, or abnormal growth. Early detection allows for better control. Remove infected plant parts immediately.", category: "Pest Control", tags: "disease, early signs, crops" },
    { title: "Water Quality for Irrigation", content: "Test irrigation water for salts, pH, and contaminants. High salt content can damage crops and soil. Filter water if necessary to remove debris.", category: "Irrigation", tags: "water, quality, irrigation" },
    { title: "Beneficial Insects in Agriculture", content: "Encourage ladybugs, lacewings, and parasitic wasps for natural pest control. Plant diverse flowers to provide nectar sources. Avoid broad-spectrum pesticides.", category: "Pest Control", tags: "beneficial insects, biological control, pests" },
    { title: "Crop Nutrient Deficiency Signs", content: "Yellow leaves indicate nitrogen deficiency, purple leaves suggest phosphorus deficiency, brown leaf edges show potassium deficiency. Soil testing confirms deficiencies.", category: "Soil", tags: "nutrients, deficiency, crops" },
    { title: "Sustainable Farming Practices", content: "Use crop rotation, cover crops, integrated pest management, and organic amendments. Reduce tillage to preserve soil structure. Conserve water and energy.", category: "Sustainable Farming", tags: "sustainable, practices, environment" },
    { title: "Post-Harvest Handling", content: "Cool produce quickly after harvest, handle gently to avoid bruising, and store at proper temperature and humidity. Clean and sanitize storage areas regularly.", category: "Management", tags: "post-harvest, storage, quality" },
    { title: "Farm Equipment Maintenance", content: "Service machinery regularly, check oil and filters, sharpen cutting tools, and store equipment properly. Preventive maintenance reduces breakdowns and extends equipment life.", category: "Management", tags: "equipment, maintenance, machinery" },
    { title: "Weather Monitoring for Farming", content: "Use weather forecasts to plan field operations, irrigation, and pest management. Install weather stations for local data. Track growing degree days for crop development.", category: "Weather", tags: "weather, monitoring, planning" },
    { title: "Soil Erosion Prevention", content: "Use cover crops, contour farming, and terracing to prevent soil erosion. Maintain vegetative cover on slopes. Avoid working soil when wet to prevent compaction.", category: "Soil", tags: "erosion, prevention, conservation" }
  ];

  console.log(`📚 Processing ${entries.length} knowledge entries...`);

  // Function to insert entry with promise
  function insertEntry(entry, embedding) {
    return new Promise((resolve, reject) => {
      const vector = Buffer.from(new Float32Array(embedding.data).buffer);
      
      db.run(
        `INSERT INTO knowledge (title, content, category, tags, embedding) VALUES (?, ?, ?, ?, ?)`,
        [entry.title, entry.content, entry.category, entry.tags, vector],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // Generate embeddings and insert
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      console.log(`🔄 Processing: ${entry.title} (${i + 1}/${entries.length})`);
      
      // Generate embedding
      const embedding = await embedder(entry.content, { pooling: "mean", normalize: true });
      
      // Insert into database
      await insertEntry(entry, embedding);
      
      console.log(`✅ Inserted: ${entry.title}`);
    } catch (err) {
      console.error(`❌ Error processing ${entry.title}:`, err);
    }
  }

  console.log("🌱 All entries processed successfully!");
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error("❌ Error closing database:", err);
    } else {
      console.log("✅ Database closed successfully");
    }
  });
}

// Run the population
populateKnowledge().catch(console.error);