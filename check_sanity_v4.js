import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '8xyje6wz',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
});

async function checkSanity() {
  const query = `*[_type == "store"] {
    _id,
    firestoreId,
    name,
    category,
    slogan
  }`;
  try {
    const results = await client.fetch(query);
    console.log("SUCCESS. Fetched stores count:", results.length);
    if(results.length > 0) {
      console.log("Sample store name object:", JSON.stringify(results[0].name));
    }
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

checkSanity();
