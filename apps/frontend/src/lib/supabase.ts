import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://byurjpsksirlrnzmwdsk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dXJqcHNrc2lybHJuem13ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2MzIzMzMsImV4cCI6MjAzMjIwODMzM30.8iilBElfDycOsQnRMC-HD-pLWLil6DSAwbmF17kVcuk"
);
