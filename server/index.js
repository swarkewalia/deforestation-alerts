const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Deforestation Alert System API is running!' });
});

app.get('/api/nasa/test', async (req, res) => {
    try {
      // NASA's direct CSV download for South America (last 24 hours)
      const nasaUrl = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_America_24h.csv';
      
      console.log('Fetching from:', nasaUrl);
      
      const response = await axios.get(nasaUrl);
      
      // Parse CSV data
      const lines = response.data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      // testing JSON data
      const sampleData = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });
        return row;
      });
      
      res.json({
        message: 'NASA FIRMS data retrieved successfully!',
        region: 'South America',
        totalFires: lines.length - 1,
        sampleData: sampleData,
        headers: headers,
        dataSource: 'MODIS South America 24h'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch NASA data',
        details: error.message 
      });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Deforestation Alert Server running on port ${PORT}`);
});

app.get('/api/alerts/amazon', async (req, res) => {
    try {
      const nasaUrl = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_America_24h.csv';
      const response = await axios.get(nasaUrl);
      
      const lines = response.data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const allFires = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });
        return row;
      });
      
      const highConfidenceFires = allFires.filter(fire => 
        parseInt(fire.confidence) >= 70
      );
      
      const amazonFires = allFires.filter(fire => {
        const lat = parseFloat(fire.latitude);
        const lon = parseFloat(fire.longitude);
        return lat >= -20 && lat <= 5 && lon >= -75 && lon <= -45;
      });
      
      const avgConfidence = allFires.reduce((sum, fire) => 
        sum + parseInt(fire.confidence), 0) / allFires.length;
      
      res.json({
        message: 'Amazon Fire Analysis Complete',
        summary: {
          totalFires: allFires.length,
          highConfidenceFires: highConfidenceFires.length,
          amazonBasinFires: amazonFires.length,
          averageConfidence: Math.round(avgConfidence),
          alertLevel: highConfidenceFires.length > 100 ? 'HIGH' : 'MEDIUM'
        },
        topFires: highConfidenceFires.slice(0, 10),
        analysisDate: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });