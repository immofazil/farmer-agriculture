const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { pipeline } = require('@xenova/transformers');

class KnowledgeService {
  constructor() {
    this.dbPath = './knowledge.db';
    this.embeddingModel = null;
    this.db = null;
    this.init();
  }

  async init() {
    try {
      // Initialize embedding model
      console.log('🧠 Loading embedding model...');
      this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('✅ Embedding model loaded successfully');

      // Initialize database
      await this.initDatabase();
      console.log('✅ Knowledge database initialized');
    } catch (error) {
      console.error('❌ Error initializing knowledge service:', error);
    }
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create knowledge table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT,
            tags TEXT,
            embedding BLOB,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async addKnowledge(title, content, category = 'general', tags = []) {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(content);
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

      return new Promise((resolve, reject) => {
        const stmt = this.db.prepare(`
          INSERT INTO knowledge (title, content, category, tags, embedding)
          VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run([
          title,
          content,
          category,
          JSON.stringify(tags),
          embeddingBuffer
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Added knowledge: ${title}`);
            resolve(this.lastID);
          }
        });

        stmt.finalize();
      });
    } catch (error) {
      console.error('❌ Error adding knowledge:', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    try {
      const output = await this.embeddingModel(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      throw error;
    }
  }

  async searchSimilar(query, limit = 5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      return new Promise((resolve, reject) => {
        this.db.all(`
          SELECT id, title, content, category, tags
          FROM knowledge
        `, (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Calculate similarity scores
          const results = rows.map(row => {
            const embedding = new Float32Array(row.embedding);
            const similarity = this.cosineSimilarity(queryEmbedding, Array.from(embedding));
            
            return {
              ...row,
              similarity,
              tags: JSON.parse(row.tags || '[]')
            };
          });

          // Sort by similarity and return top results
          const topResults = results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

          resolve(topResults);
        });
      });
    } catch (error) {
      console.error('❌ Error searching knowledge:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getAllKnowledge() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT id, title, content, category, tags, created_at
        FROM knowledge
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const results = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
          }));
          resolve(results);
        }
      });
    });
  }

  async deleteKnowledge(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM knowledge WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Deleted knowledge with ID: ${id}`);
          resolve(this.changes);
        }
      });
    });
  }

  async seedInitialKnowledge() {
    try {
      // Check if we already have knowledge
      const existing = await this.getAllKnowledge();
      if (existing.length > 0) {
        console.log('📚 Knowledge base already contains data');
        return;
      }

      console.log('🌱 Seeding initial farming knowledge...');

      const initialKnowledge = [
        {
          title: "Wheat Cultivation Basics",
          content: "Wheat is a cereal grain grown worldwide. Best planted in well-drained loamy soil with pH 6.0-7.5. Requires 450-650mm annual rainfall. Plant in October-November for winter wheat. Use 100-125 kg seeds per hectare. Apply NPK fertilizer at 120:60:40 kg/ha ratio. Harvest when moisture content is 12-14%.",
          category: "crops",
          tags: ["wheat", "cereals", "planting", "fertilizer", "harvest"]
        },
        {
          title: "Rice Farming Techniques",
          content: "Rice requires flooded fields and warm climate. Transplant 20-25 day old seedlings in puddled fields. Maintain 2-5cm water level throughout growing season. Apply nitrogen in 3 splits: 50% basal, 25% at tillering, 25% at panicle initiation. Control weeds within first 45 days. Harvest at 80% grain maturity.",
          category: "crops",
          tags: ["rice", "paddy", "transplanting", "irrigation", "nitrogen"]
        },
        {
          title: "Soil pH Management",
          content: "Soil pH affects nutrient availability. Most crops prefer pH 6.0-7.0. Test soil annually. For acidic soil (pH <6.0), apply lime at 2-4 tons/hectare. For alkaline soil (pH >8.0), apply gypsum or sulfur. Organic matter helps buffer pH changes. Add compost regularly to maintain soil health.",
          category: "soil",
          tags: ["pH", "lime", "gypsum", "soil testing", "nutrients"]
        },
        {
          title: "Drip Irrigation Benefits",
          content: "Drip irrigation delivers water directly to plant roots. Saves 30-50% water compared to flood irrigation. Reduces weed growth and disease. Allows precise fertilizer application (fertigation). Initial cost higher but saves long-term. Suitable for vegetables, fruits, and cash crops. Maintain 1.5-2.0 bar pressure.",
          category: "irrigation",
          tags: ["drip irrigation", "water saving", "fertigation", "efficiency"]
        },
        {
          title: "Integrated Pest Management",
          content: "IPM combines biological, cultural, and chemical controls. Monitor pest levels weekly. Use economic threshold levels before spraying. Encourage beneficial insects with diverse crops. Rotate pesticides to prevent resistance. Apply neem oil for organic control. Remove crop residues to break pest cycles.",
          category: "pest_control",
          tags: ["IPM", "biological control", "pesticides", "neem", "monitoring"]
        },
        {
          title: "Composting for Farmers",
          content: "Compost improves soil structure and fertility. Mix green materials (kitchen scraps, fresh grass) with brown materials (dry leaves, straw) in 3:1 ratio. Turn pile every 2 weeks. Maintain moisture like wrung-out sponge. Ready in 3-6 months. Apply 2-4 tons per hectare annually.",
          category: "organic",
          tags: ["compost", "organic matter", "soil health", "recycling"]
        },
        {
          title: "Weather-Based Farming Decisions",
          content: "Monitor weather forecasts for farming operations. Plant after last frost date. Avoid spraying before rain. Harvest grains at low humidity. Use weather data for irrigation scheduling. Protect crops from extreme weather with mulching or covers. Plan field operations during suitable weather windows.",
          category: "weather",
          tags: ["weather", "forecasting", "timing", "protection", "planning"]
        },
        {
          title: "Crop Rotation Benefits",
          content: "Rotate crops to break pest and disease cycles. Legumes fix nitrogen for following crops. Deep-rooted crops improve soil structure. Rotate between crop families (grasses, legumes, brassicas). Include cover crops in rotation. Plan 3-4 year rotation cycles. Avoid planting same family consecutively.",
          category: "sustainable",
          tags: ["rotation", "legumes", "soil health", "pest control", "sustainability"]
        }
      ];

      for (const knowledge of initialKnowledge) {
        await this.addKnowledge(
          knowledge.title,
          knowledge.content,
          knowledge.category,
          knowledge.tags
        );
      }

      console.log('✅ Initial knowledge base seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding knowledge:', error);
    }
  }
}

module.exports = new KnowledgeService();