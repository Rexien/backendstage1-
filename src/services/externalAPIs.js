const axios = require('axios');

async function fetchExternalData(name) {
  try {
    const [genderRes, agifyRes, nationalizeRes] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${encodeURIComponent(name)}`),
      axios.get(`https://api.agify.io?name=${encodeURIComponent(name)}`),
      axios.get(`https://api.nationalize.io?name=${encodeURIComponent(name)}`)
    ]);

    const genderData = genderRes.data;
    const agifyData = agifyRes.data;
    const nationalizeData = nationalizeRes.data;

    // Edge cases
    if (!genderData.gender || genderData.count === 0) {
      const error = new Error('Genderize returned an invalid response');
      error.status = 502;
      throw error;
    }

    if (agifyData.age === null) {
      const error = new Error('Agify returned an invalid response');
      error.status = 502;
      throw error;
    }

    if (!nationalizeData.country || nationalizeData.country.length === 0) {
      const error = new Error('Nationalize returned an invalid response');
      error.status = 502;
      throw error;
    }

    // Classification rules
    let age_group = "adult";
    if (agifyData.age <= 12) age_group = "child";
    else if (agifyData.age <= 19) age_group = "teenager";
    else if (agifyData.age >= 60) age_group = "senior";

    // Highest probability country
    let topCountry = nationalizeData.country[0];
    for (let c of nationalizeData.country) {
      if (c.probability > topCountry.probability) {
        topCountry = c;
      }
    }

    return {
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: agifyData.age,
      age_group,
      country_id: topCountry.country_id,
      country_probability: topCountry.probability
    };

  } catch (error) {
    if (error.status === 502) throw error;
    const err = new Error('Upstream or server failure');
    err.status = 502;
    throw err;
  }
}

module.exports = {
  fetchExternalData
};
