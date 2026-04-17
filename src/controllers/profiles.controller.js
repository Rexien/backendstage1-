const { PrismaClient } = require('@prisma/client');
const { v7: uuidv7 } = require('uuid');
const { fetchExternalData } = require('../services/externalAPIs');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

const createProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (name === undefined || name === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty name'
      });
    }

    if (typeof name !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'Invalid type'
      });
    }

    if (name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty name'
      });
    }

    const trimmedName = name.trim();

    // Check idempotency
    const existingProfile = await prisma.profile.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingProfile) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: existingProfile
      });
    }

    // External APIs
    let externalData;
    try {
      externalData = await fetchExternalData(trimmedName);
    } catch (err) {
      return res.status(err.status || 502).json({
        status: 'error',
        message: err.message
      });
    }

    // Save to DB
    const profileId = uuidv7();
    const newProfile = await prisma.profile.create({
      data: {
        id: profileId,
        name: trimmedName,
        gender: externalData.gender,
        gender_probability: externalData.gender_probability,
        sample_size: externalData.sample_size,
        age: externalData.age,
        age_group: externalData.age_group,
        country_id: externalData.country_id,
        country_probability: externalData.country_probability,
        created_at: new Date()
      }
    });

    res.status(201).json({
      status: 'success',
      data: newProfile
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const { gender, country_id, age_group } = req.query;

    const filterOptions = {};
    if (gender) {
      filterOptions.gender = { equals: gender, mode: 'insensitive' };
    }
    if (country_id) {
      filterOptions.country_id = { equals: country_id, mode: 'insensitive' };
    }
    if (age_group) {
      filterOptions.age_group = { equals: age_group, mode: 'insensitive' };
    }

    const [profiles, count] = await Promise.all([
      prisma.profile.findMany({ where: filterOptions }),
      prisma.profile.count({ where: filterOptions })
    ]);

    // Format output mapping to exclude probabilities if we want to match exact structure given, 
    // Wait, the specification output for Get All Profiles excludes probabilities?
    // Let me check.
    const formattedData = profiles.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      age: p.age,
      age_group: p.age_group,
      country_id: p.country_id
    }));

    res.status(200).json({
      status: 'success',
      count,
      data: formattedData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    await prisma.profile.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createProfile,
  getProfileById,
  getAllProfiles,
  deleteProfile
};
