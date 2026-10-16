class SensorFusion {
  constructor() {
    this.gyroData = { x: 0, y: 0, z: 0 };
    this.visionData = { x: 0, y: 0, z: 0 };
  }

  updateGyro(data) {
    this.gyroData = data;
  }

  updateVision(data) {
    this.visionData = data;
  }

  getFusedPosition() {
    return {
      x: (this.gyroData.x + this.visionData.x) / 2,
      y: (this.gyroData.y + this.visionData.y) / 2,
      z: (this.gyroData.z + this.visionData.z) / 2
    };
  }
}

module.exports = new SensorFusion();
