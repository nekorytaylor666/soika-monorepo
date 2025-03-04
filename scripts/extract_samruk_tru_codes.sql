-- SQL script to extract unique TRU codes from Samruk contracts and insert them into ktruCodes table
-- This script extracts TRU codes from the truHistory field in samruk_contracts table

-- First, create a temporary table to store extracted TRU codes
CREATE TEMP TABLE temp_samruk_tru_codes AS
WITH extracted_codes AS (
  SELECT 
    (tru_history->>'code') AS code,
    (tru_history->>'ru') AS name_ru,
    (tru_history->>'briefRu') AS description_ru
  FROM 
    samruk_contracts,
    jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(tru_history) = 'array' THEN tru_history
        ELSE jsonb_build_array(tru_history)
      END
    ) AS tru_history
  WHERE 
    tru_history IS NOT NULL AND
    (tru_history->>'code') IS NOT NULL
)
SELECT DISTINCT 
  code,
  name_ru,
  description_ru
FROM 
  extracted_codes
WHERE 
  code IS NOT NULL AND
  code != '';

-- Log the number of unique TRU codes found
SELECT COUNT(*) AS unique_tru_codes_count FROM temp_samruk_tru_codes;

-- Log how many of these codes are new (not already in ktru_codes)
SELECT COUNT(*) AS new_tru_codes_count 
FROM temp_samruk_tru_codes t
WHERE NOT EXISTS (
  SELECT 1 FROM ktru_codes k WHERE k.code = t.code
);

-- Update existing TRU codes to have source='any' if they already exist with source='goszakup'
UPDATE ktru_codes
SET source = 'any'
WHERE code IN (
  SELECT t.code 
  FROM temp_samruk_tru_codes t
  JOIN ktru_codes k ON k.code = t.code
  WHERE k.source = 'goszakup'
);

-- Log the number of codes updated to 'any'
SELECT COUNT(*) AS updated_to_any_count 
FROM ktru_codes 
WHERE source = 'any';

-- Create a temporary table for codes that don't exist yet
CREATE TEMP TABLE new_ktru_codes AS
SELECT 
  t.code,
  t.name_ru,
  t.description_ru,
  'samruk' AS source,
  NOW() AS created_at,
  NOW() AS updated_at
FROM 
  temp_samruk_tru_codes t
LEFT JOIN ktru_codes k ON k.code = t.code
WHERE 
  k.code IS NULL;

-- Log the number of new codes to be inserted
SELECT COUNT(*) AS codes_to_insert_count FROM new_ktru_codes;

-- Insert the new codes with ON CONFLICT DO NOTHING to handle any race conditions
INSERT INTO ktru_codes (code, name_ru, description_ru, source, created_at, updated_at)
SELECT code, name_ru, description_ru, source, created_at, updated_at
FROM new_ktru_codes
ON CONFLICT (code) DO NOTHING;

-- Log the number of new TRU codes inserted
SELECT COUNT(*) AS inserted_tru_codes_count 
FROM ktru_codes 
WHERE source = 'samruk' AND 
      created_at >= (NOW() - INTERVAL '5 minutes');

-- Clean up
DROP TABLE temp_samruk_tru_codes;
DROP TABLE new_ktru_codes;

-- Generate embeddings for the newly inserted KTRU codes
-- Note: This is a comment as embeddings typically need to be generated in application code
-- You'll need to run a separate process to generate embeddings for these new codes
-- COMMENT: Run your embedding generation process for all ktru_codes where embedding IS NULL 