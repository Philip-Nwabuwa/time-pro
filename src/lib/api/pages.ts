import { supabase } from "../supabase";
import type { PageData, PageInsert, PageUpdate } from "./types";

export async function fetchPages(): Promise<PageData[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Get pages the user created (explicitly filter by created_by to avoid RLS confusion)
  const { data: ownedPages, error: ownedError } = await supabase
    .from("pages")
    .select("id, title, description, created_by, image_url")
    .eq("created_by", user.user.id)
    .order("created_at", { ascending: false });

  if (ownedError) throw ownedError;

  // Get pages where user is a member
  const { data: membershipData, error: memberError } = await supabase
    .from("page_members")
    .select(
      `
      page_id,
      role,
      pages!inner (
        id,
        title,
        description,
        created_by,
        image_url,
        created_at
      )
    `,
    )
    .eq("user_id", user.user.id)
    .order("pages(created_at)", { ascending: false });

  if (memberError) throw memberError;

  // Combine both sets of pages, avoiding duplicates
  const allPageIds = new Set<string>();
  const allPages: Array<{
    id: string;
    title: string;
    description: string | null;
    created_by: string | null;
    image_url?: string | null;
    userRole?: string;
  }> = [];

  // Add owned pages
  ownedPages.forEach((page) => {
    allPageIds.add(page.id);
    allPages.push({
      ...page,
      userRole: "admin",
    });
  });

  // Add member pages (if not already included as owned)
  membershipData.forEach((membership) => {
    const page = membership.pages;
    if (!allPageIds.has(page.id)) {
      allPageIds.add(page.id);
      allPages.push({
        ...page,
        userRole: membership.role,
      });
    }
  });

  console.log("🔄 Transforming pages data, found pages:", allPages.length);
  allPages.forEach((page, index) => {
    console.log(`📄 Page ${index + 1}:`, {
      id: page.id,
      title: page.title,
      image_url: page.image_url,
      hasImageUrl: !!page.image_url,
      imageUrlLength: page.image_url?.length || 0,
    });
  });

  // Transform to PageData format with counts
  const transformedPages: PageData[] = await Promise.all(
    allPages.map(async (page) => {
      // Get member count by fetching actual members (more reliable than count query)
      const { data: members, error: membersError } = await supabase
        .from("page_members")
        .select("id")
        .eq("page_id", page.id);

      if (membersError) {
        console.error(
          `Error fetching members for page ${page.id}:`,
          membersError,
        );
      }

      const memberCount = members?.length || 0;
      console.log(`📊 Home page - Page ${page.id} member count:`, memberCount);

      // Get event count
      const { count: eventCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("page_id", page.id);

      const transformedPage = {
        id: page.id,
        title: page.title,
        desc: page.description || "",
        members: memberCount || 0,
        events: eventCount || 0,
        role: page.userRole as "admin" | "member",
        imageUrl: page.image_url || undefined,
      };

      console.log("🔄 Transformed page:", {
        id: transformedPage.id,
        title: transformedPage.title,
        imageUrl: transformedPage.imageUrl,
        hasImageUrl: !!transformedPage.imageUrl,
      });

      return transformedPage;
    }),
  );

  console.log(
    "✅ Final transformed pages:",
    transformedPages.map((p) => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      hasImageUrl: !!p.imageUrl,
    })),
  );

  return transformedPages;
}

export async function fetchAllPages(): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    createdAt: string;
    membersCount: number;
    eventsCount: number;
    isPrivate: boolean;
    imageUrl?: string;
    isMember?: boolean; // Add this field
  }>
> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Try RPC that returns all pages metadata regardless of membership (requires DB setup)
  let pages: Array<{
    id: string;
    title: string;
    description: string | null;
    created_at: string | null;
    is_private: boolean | null;
    image_url: string | null;
  }> | null = null;
  let error: any = null;

  try {
    const rpc = await (supabase as any).rpc("get_all_pages_public");
    if (rpc.data) {
      pages = rpc.data as any[];
    } else if (rpc.error) {
      error = rpc.error;
    }
  } catch (_e) {
    // ignore, will fallback
  }

  // Fallback to direct select, which may be limited by RLS
  if (!pages) {
    const fallback = await supabase
      .from("pages")
      .select(
        `
        id,
        title,
        description,
        created_at,
        is_private,
        image_url
      `,
      )
      .order("created_at", { ascending: false });
    pages = fallback.data || [];
    error = fallback.error;
  }

  if (error && !pages) throw error;

  console.log("🌐 Processing all pages for discovery, found:", pages.length);
  pages.forEach((page, index) => {
    console.log(`🌐 Discovery page ${index + 1}:`, {
      id: page.id,
      title: page.title,
      image_url: page.image_url,
      hasImageUrl: !!page.image_url,
    });
  });

  // Get member and event counts for each page, plus check if current user is a member
  const pagesWithCounts = await Promise.all(
    pages.map(async (page) => {
      // Get member count by fetching actual members (more reliable than count query)
      const { data: members, error: membersError } = await supabase
        .from("page_members")
        .select("id")
        .eq("page_id", page.id);

      if (membersError) {
        console.error(
          `Error fetching members for page ${page.id}:`,
          membersError,
        );
      }

      const memberCount = members?.length || 0;

      // Get event count
      const { count: eventCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("page_id", page.id);

      // Check if current user is already a member
      const { data: userMembership } = await supabase
        .from("page_members")
        .select("id")
        .eq("page_id", page.id)
        .eq("user_id", user.user.id)
        .single();

      const processedPage = {
        id: page.id,
        title: page.title,
        description: page.description,
        category: "Community", // Default category until category field is added to database
        createdAt: page.created_at || new Date().toISOString(),
        membersCount: memberCount || 0,
        eventsCount: eventCount || 0,
        isPrivate: page.is_private || false,
        imageUrl: page.image_url || undefined,
        isMember: !!userMembership, // Add membership status
      };

      console.log("🌐 Processed discovery page:", {
        id: processedPage.id,
        title: processedPage.title,
        imageUrl: processedPage.imageUrl,
        hasImageUrl: !!processedPage.imageUrl,
        isMember: processedPage.isMember,
      });

      return processedPage;
    }),
  );

  console.log(
    "✅ Final discovery pages with images:",
    pagesWithCounts
      .filter((p) => p.imageUrl)
      .map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        isMember: p.isMember,
      })),
  );

  return pagesWithCounts;
}

export async function fetchPageById(id: string): Promise<PageData | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: page, error } = await supabase
    .from("pages")
    .select(
      `
      id,
      title,
      description,
      created_by,
      image_url
    `,
    )
    .eq("id", id)
    .single();

  if (error || !page) return null;

  // Get member count by fetching actual members (more reliable than count query)
  const { data: members, error: membersError } = await supabase
    .from("page_members")
    .select("id")
    .eq("page_id", page.id);

  if (membersError) {
    console.error("Error fetching members:", membersError);
  }

  const memberCount = members?.length || 0;
  console.log(`📊 Page ${page.id} member count:`, memberCount);

  // Get event count
  const { count: eventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("page_id", page.id);

  // Get user's role
  const { data: memberData } = await supabase
    .from("page_members")
    .select("role")
    .eq("page_id", page.id)
    .eq("user_id", user.user.id)
    .single();

  const isCreator = page.created_by === user.user.id;
  const role = isCreator
    ? "admin"
    : (memberData?.role as "admin" | "member") || "member";

  return {
    id: page.id,
    title: page.title,
    desc: page.description || "",
    members: memberCount || 0,
    events: eventCount || 0,
    role,
    imageUrl: page.image_url || undefined,
  };
}

export async function uploadPageImage(
  file: File,
  pageId?: string,
): Promise<{ filePath: string; publicUrl: string }> {
  const { data: user, error: authError } = await supabase.auth.getUser();

  console.log("🔐 Auth check result:", {
    hasUser: !!user?.user,
    userId: user?.user?.id,
    userEmail: user?.user?.email,
    authError: authError?.message || "no error",
  });

  if (authError) {
    console.error("❌ Auth error:", authError);
    throw new Error(`Authentication error: ${authError.message}`);
  }

  if (!user.user) {
    console.error("❌ No authenticated user found");
    throw new Error("Not authenticated");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `${pageId || "temp"}/${fileName}`;

  console.log("📤 Starting file upload to Supabase storage:", {
    fileName,
    filePath,
    fileSize: file.size,
    fileType: file.type,
    pageId: pageId || "temp",
    userId: user.user.id,
  });

  // Skip bucket listing check - just proceed with upload since we know bucket exists

  // Upload file to storage
  console.log("📤 Attempting upload to page-images bucket...");
  console.log("🔍 Upload details:", {
    bucket: "page-images",
    filePath,
    fileName,
    fileType: file.type,
    fileSize: file.size,
    userAuth: !!user.user?.id,
    userId: user.user?.id,
  });

  // First, let's test if we can even access the bucket
  console.log("🧪 Testing bucket access...");
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from("page-images")
      .list("", {
        limit: 1,
      });

    console.log("🧪 Bucket test result:", {
      canAccess: !bucketError,
      error: bucketError?.message || "no error",
      hasFiles: !!bucketData?.length,
    });

    if (bucketError) {
      console.error("❌ Cannot access bucket:", bucketError);
    }
  } catch (bucketTestError) {
    console.error("❌ Bucket test failed:", bucketTestError);
  }

  let uploadResult;
  try {
    // Try upload with minimal options first
    uploadResult = await supabase.storage
      .from("page-images")
      .upload(filePath, file, {
        upsert: true, // Allow overwrite to avoid conflicts
      });

    console.log("📤 Upload result received:", {
      hasData: !!uploadResult.data,
      hasError: !!uploadResult.error,
      dataKeys: uploadResult.data ? Object.keys(uploadResult.data) : "none",
      errorKeys: uploadResult.error ? Object.keys(uploadResult.error) : "none",
    });
  } catch (uploadException) {
    console.error("❌ Upload threw exception:", uploadException);
    throw uploadException;
  }

  const { data: uploadData, error: uploadError } = uploadResult;

  if (uploadError) {
    console.error("❌ File upload failed with error:", uploadError);
    console.error("❌ Error details:", {
      message: uploadError.message || "No message",
    });
    console.error(
      "❌ Full error object:",
      JSON.stringify(uploadError, null, 2),
    );

    // Check for specific error types
    if (
      uploadError.message?.includes("Bucket not found") ||
      uploadError.message?.includes("bucket")
    ) {
      throw new Error(
        "Storage bucket not found. Please check your Supabase storage configuration.",
      );
    }

    if (
      uploadError.message?.includes("permission") ||
      uploadError.message?.includes("unauthorized")
    ) {
      throw new Error("Permission denied. Check your storage RLS policies.");
    }

    throw new Error(`Upload failed: ${uploadError.message || "Unknown error"}`);
  }

  console.log("✅ File uploaded successfully:", uploadData);

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("page-images").getPublicUrl(filePath);

  console.log("🔗 Generated public URL:", {
    publicUrl,
    filePath,
    urlLength: publicUrl.length,
    isHttps: publicUrl.startsWith("https://"),
  });

  // Test the URL accessibility
  try {
    const testResponse = await fetch(publicUrl, { method: "HEAD" });
    console.log("🔍 URL accessibility test result:", {
      status: testResponse.status,
      statusText: testResponse.statusText,
      accessible: testResponse.ok,
      contentType: testResponse.headers.get("content-type"),
      contentLength: testResponse.headers.get("content-length"),
    });
  } catch (testError) {
    console.warn("⚠️ Could not test URL accessibility:", testError);
  }

  return { filePath, publicUrl };
}

export async function createPage(
  pageData: Omit<PageInsert, "created_by">,
  imageFile?: File,
): Promise<PageData> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  console.log("🚀 Creating page with data:", {
    title: pageData.title,
    hasImage: !!imageFile,
    imageSize: imageFile?.size,
    imageType: imageFile?.type,
    userId: user.user.id,
  });

  // Create page first without image - this isolates the RLS issue
  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      ...pageData,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Page creation failed:", error);
    throw error;
  }

  console.log("✅ Page created successfully:", {
    id: page.id,
    title: page.title,
    created_by: page.created_by,
  });

  // Handle image upload after page creation if provided
  if (imageFile) {
    try {
      console.log("📤 Starting image upload for page:", page.id);
      console.log("📤 Image file details:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
        lastModified: imageFile.lastModified,
      });

      const { filePath, publicUrl } = await uploadPageImage(imageFile, page.id);
      console.log("✅ Image uploaded successfully:", { filePath, publicUrl });

      // Verify the image URL is accessible before updating database
      try {
        const response = await fetch(publicUrl, { method: "HEAD" });
        console.log("🔍 Image URL accessibility test:", {
          url: publicUrl,
          status: response.status,
          accessible: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch (fetchError) {
        console.warn("⚠️ Could not verify image URL accessibility:", fetchError);
      }

      // Update the page with the image information
      console.log("💾 Updating page with image URL in database...");
      const { data: updatedPage, error: updateError } = await supabase
        .from("pages")
        .update({
          image_url: publicUrl,
          image_file_path: filePath,
        })
        .eq("id", page.id)
        .select("id, image_url, image_file_path")
        .single();

      if (updateError) {
        console.error("❌ Failed to update page with image:", updateError);
      } else {
        console.log("✅ Page updated with image successfully:", updatedPage);
        // Update the local page object with the new image data
        page.image_url = publicUrl;
        page.image_file_path = filePath;

        // Verify the database update worked
        const { data: verifyPage, error: verifyError } = await supabase
          .from("pages")
          .select("id, title, image_url")
          .eq("id", page.id)
          .single();

        if (verifyError) {
          console.error("❌ Failed to verify page update:", verifyError);
        } else {
          console.log("🔍 Database verification after update:", verifyPage);
        }
      }
    } catch (uploadError) {
      console.error("❌ Failed to upload page image:", uploadError);
    }
  }

  // Add creator as admin member
  const { error: memberError } = await supabase.from("page_members").insert({
    page_id: page.id,
    user_id: user.user.id,
    role: "admin",
  });

  if (memberError) {
    console.error("Failed to add page member:", memberError);
    // Don't throw here - the page was created successfully, member can be added later
  }

  // Wait a brief moment to ensure database consistency
  console.log("⏳ Waiting for database consistency...");
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Fetch the updated page data to ensure we have the latest image information
  console.log("🔄 Fetching updated page data...");
  const updatedPage = await fetchPageById(page.id);
  console.log("🔍 Final page data after creation:", {
    id: updatedPage?.id,
    title: updatedPage?.title,
    imageUrl: updatedPage?.imageUrl,
    hasImageUrl: !!updatedPage?.imageUrl,
    imageUrlLength: updatedPage?.imageUrl?.length || 0,
  });

  if (updatedPage) {
    console.log("✅ Returning updated page data with image");
    return updatedPage;
  }

  // Fallback to basic data if fetch fails
  return {
    id: page.id,
    title: page.title,
    desc: page.description || "",
    members: 1,
    events: 0,
    role: "admin",
    imageUrl: page.image_url || undefined,
  };
}

export async function updatePage(
  id: string,
  updates: PageUpdate,
): Promise<PageData> {
  const { error } = await supabase.from("pages").update(updates).eq("id", id);

  if (error) throw error;

  // Fetch updated page data
  const updatedPage = await fetchPageById(id);
  if (!updatedPage) throw new Error("Page not found after update");

  return updatedPage;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("pages").delete().eq("id", id);

  if (error) throw error;
}
