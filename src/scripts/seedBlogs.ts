import mongoose from "mongoose";
import config from "../app/config";
import { Blog } from "../app/modules/blog/blog.model";
import User from "../app/modules/user/user.model";
import { Media } from "../app/modules/media-library/media-library.model";
import { Category } from "../app/modules/category/category.model";
import { Comment } from "../app/modules/comment/comment.model";

async function seedBlogs() {
  try {
    console.log("Connecting to database...", config.db_url);
    await mongoose.connect(config.db_url as string);
    console.log("Database connected.");

    // Delete existing fake blogs and their comments
    const existingFakeBlogs = await Blog.find({ title: { $regex: "^Fake Blog Post" } });
    const existingFakeBlogIds = existingFakeBlogs.map(b => b._id);
    await Comment.deleteMany({ blog: { $in: existingFakeBlogIds } });
    await Blog.deleteMany({ title: { $regex: "^Fake Blog Post" } });
    console.log("Cleared old fake blogs and comments.");

    let user = await User.findOne();
    if (!user) {
      console.log("No user found. Creating a dummy user...");
      user = await User.create({
        name: "Dummy Author",
        email: "dummyauthor@example.com",
        password: "password123",
        role: "admin",
        clientInfo: {
          device: "PC",
          browser: "Chrome",
          ipAddress: "127.0.0.1",
        },
      });
    }
    
    // Get an existing Media and Category
    const media = await Media.findOne();
    const categoryDoc = await Category.findOne();

    if (!media) {
      console.warn("No Media found in database. Using empty references.");
    }
    if (!categoryDoc) {
      console.warn("No Category found in database. Using empty references.");
    }

    const fakeBlogs = [];
    for (let i = 1; i <= 20; i++) {
      fakeBlogs.push({
        title: `Fake Blog Post ${i}`,
        slug: `fake-blog-post-${i}-${Date.now()}`,
        content: `<p>This is the content for fake blog post ${i}. It has some amazing information.</p>`,
        excerpt: `This is a short excerpt for fake blog ${i}.`,
        category: categoryDoc ? categoryDoc.name : "Technology",
        categoryIds: categoryDoc ? [categoryDoc._id] : [],
        thumbnail: media ? media.key : "", // Assume key is used for URL or we need to pass a string
        thumbnailId: media ? media._id : undefined,
        coverImage: media ? media.key : "",
        coverImageId: media ? media._id : undefined,
        status: true,
        isFeatured: i % 5 === 0,
        viewCount: Math.floor(Math.random() * 100),
        author: user._id,
      });
    }

    console.log(`Inserting ${fakeBlogs.length} fake blogs...`);
    const insertedBlogs = await Blog.insertMany(fakeBlogs);

    console.log("Adding comments to each blog...");
    const fakeComments = [];
    for (const blog of insertedBlogs) {
      // Add 2 comments per blog
      fakeComments.push({
        name: "John Doe",
        emailOrPhone: "john@example.com",
        comment: "This is a great post! Thanks for sharing.",
        blog: blog._id,
        status: "approved"
      });
      fakeComments.push({
        name: "Jane Smith",
        emailOrPhone: "jane@example.com",
        comment: "Very informative, helped me a lot.",
        blog: blog._id,
        status: "approved"
      });
    }
    await Comment.insertMany(fakeComments);

    console.log("Successfully seeded 20 fake blogs with media, categories, and comments!");
  } catch (error) {
    console.error("Error seeding blogs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

seedBlogs();
