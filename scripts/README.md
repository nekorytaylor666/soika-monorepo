# Samruk TRU Codes Import Scripts

This directory contains scripts for extracting TRU codes from Samruk contracts and importing them into the ktruCodes table.

## Files

- `extract_samruk_tru_codes.sql`: SQL script to extract unique TRU codes from Samruk contracts and insert them into the ktruCodes table.
- `import_samruk_tru_codes.ts`: TypeScript script that runs the SQL script and generates embeddings for the newly inserted KTRU codes.

## Usage

To run the import process, use the following command from the root of the project:

```bash
pnpm import:samruk-tru
```

This will:

1. Extract unique TRU codes from the `truHistory` field in the `samruk_contracts` table
2. Update existing TRU codes to have `source='any'` if they exist in both Goszakup and Samruk
3. Insert new codes into the `ktru_codes` table with `source` set to "samruk"
4. Generate embeddings for all KTRU codes that don't have embeddings yet

## How It Works

The process works in two steps:

1. **SQL Extraction**:

   - Creates a temporary table to store extracted TRU codes
   - Extracts unique codes, names, and descriptions from the `truHistory` field
   - Logs how many unique TRU codes were found and how many are new (not already in the database)
   - Updates existing codes to have `source='any'` if they already exist in the database with `source='goszakup'`
   - Creates a temporary table for new codes to safely handle the insertion process
   - Inserts only new codes that don't already exist in the `ktru_codes` table
   - Sets the `source` field to "samruk" for newly inserted codes
   - Logs detailed statistics at each step of the process
   - Safely handles duplicate codes to avoid unique constraint violations

2. **Embedding Generation**:
   - Finds all KTRU codes without embeddings
   - Generates embeddings for each code using the OpenAI embeddings API
   - Updates the records with the generated embeddings
   - Logs progress during the embedding generation process

## Notes

- The script handles both array and object formats of the `truHistory` field
- It updates codes that exist in both Goszakup and Samruk to have `source='any'`
- It safely handles duplicate codes to avoid unique constraint violations
- It provides detailed logging at each step, showing:
  - How many unique TRU codes were found in Samruk contracts
  - How many of these codes are new (not already in the database)
  - How many existing codes were updated to have `source='any'`
  - How many new codes were prepared for insertion
  - How many new codes were successfully inserted
- Embedding generation is done in batches with progress logging
