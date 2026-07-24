import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tcunvbfazcdbvkywgkok.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdW52YmZhemNkYnZreXdna29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDY1NzYsImV4cCI6MjEwMDMyMjU3Nn0.OWO4yvXYjq-xAQE6DeXqOqeJ37NHQVDXBtRX8acuYow";

export const supabase = createClient(supabaseUrl, supabaseKey);
