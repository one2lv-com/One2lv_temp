const axios = require('axios');

class RegistryConnection {
  constructor() {
    this.endpoint = 'https://moltbook.com/api/registry';
    this.connected = false;
  }

  async connect() {
    try {
      const response = await axios.get(this.endpoint);
      this.connected = true;
      return { success: true, data: response.data };
    } catch(e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async sync(data) {
    if (!this.connected) await this.connect();
    try {
      const response = await axios.post(this.endpoint, data);
      return { success: true, data: response.data };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = new RegistryConnection();
