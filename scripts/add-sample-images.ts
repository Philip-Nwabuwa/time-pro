import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample image URLs from Unsplash for different page categories
const sampleImages = [
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=450&fit=crop", // Technology/Business meeting
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop", // Community event
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=450&fit=crop", // Education/Learning
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=450&fit=crop", // Workshop/Conference
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop", // Team collaboration
];

async function addSampleImages() {
  console.log("🖼️ Adding sample images to existing pages...");

  // Get all pages without images
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, title, image_url")
    .is("image_url", null);

  if (error) {
    console.error("❌ Error fetching pages:", error);
    return;
  }

  if (!pages || pages.length === 0) {
    console.log("✅ No pages without images found");
    return;
  }

  console.log(`📄 Found ${pages.length} pages without images`);

  // Update each page with a sample image
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const imageUrl = sampleImages[i % sampleImages.length];

    console.log(`🖼️ Updating page "${page.title}" with image: ${imageUrl}`);

    const { error: updateError } = await supabase
      .from("pages")
      .update({
        image_url: imageUrl,
      })
      .eq("id", page.id);

    if (updateError) {
      console.error(`❌ Error updating page ${page.id}:`, updateError);
    } else {
      console.log(`✅ Updated page "${page.title}" successfully`);
    }
  }

  console.log("🎉 Sample images added successfully!");
}

if (require.main === module) {
  addSampleImages().catch(console.error);
}

export default addSampleImages;
