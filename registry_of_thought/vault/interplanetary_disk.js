const fs = require('fs');
const path = require('path');

class InterplanetaryDisk {
  constructor() {
    this.basePath = path.join(__dirname, 'vectors');
    this.initStorage();
  }

  initStorage() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async store(key, vector, metadata = {}) {
    const entry = {
      key,
      vector,
      metadata,
      timestamp: Date.now()
    };

    const filePath = path.join(this.basePath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
    return { success: true, path: filePath };
  }

  async retrieve(key) {
    const filePath = path.join(this.basePath, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Key not found' };
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data: JSON.parse(data) };
  }

  async search(query, limit = 10) {
    const files = fs.readdirSync(this.basePath);
    const results = [];

    for (const file of files.slice(0, limit)) {
      const data = fs.readFileSync(path.join(this.basePath, file), 'utf8');
      results.push(JSON.parse(data));
    }

    return { success: true, results };
  }

  async delete(key) {
    const filePath = path.join(this.basePath, `${key}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'Key not found' };
  }
}

module.exports = new InterplanetaryDisk();
