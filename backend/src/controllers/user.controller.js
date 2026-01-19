import { User } from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

export async function addAddress(req, res) {
  try {
    const { storeLocation, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } =
      req.body;

    const user = req.user;

    if (!storeLocation || !fullName || !streetAddress || !city || !state || !zipCode || !phoneNumber) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      storeLocation,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault: isDefault || false,
    });

    await user.save();

    res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAddresses(req, res) {
  try {
    const user = req.user;

    res.status(200).json({ addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateAddress(req, res) {
  try {
    const { storeLocation, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } =
      req.body;

    const { addressId } = req.params;

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Validate storeLocation if provided
    const validStoreLocations = ["Θεσσαλονίκη", "Χαλκιδική Πρώτο Πόδι", "Χαλκιδική Δεύτερο Πόδι", "Χαλκιδική Τρίτο Πόδι", "Άλλο"];
    if (storeLocation !== undefined && storeLocation !== null && storeLocation !== "") {
      if (!validStoreLocations.includes(storeLocation)) {
        return res.status(400).json({ error: `Invalid store location. Must be one of: ${validStoreLocations.join(", ")}` });
      }
      address.storeLocation = storeLocation;
    } else if (!address.storeLocation) {
      // If address doesn't have storeLocation and none is provided, set default
      address.storeLocation = "Άλλο";
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (fullName !== undefined) address.fullName = fullName;
    if (streetAddress !== undefined) address.streetAddress = streetAddress;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (phoneNumber !== undefined) address.phoneNumber = phoneNumber;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    // Fix any other addresses that might be missing storeLocation (for backward compatibility)
    user.addresses.forEach((addr) => {
      if (!addr.storeLocation) {
        // Set default value for old addresses without storeLocation
        addr.storeLocation = "Άλλο";
      }
    });

    await user.save();

    res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error updating address:", error);
    // Check if it's a validation error
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const user = req.user;

    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const user = req.user;

    // check if product is already in the wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    const user = req.user;

    // check if product is already in the wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product not found in wishlist" });
    }

    user.wishlist.pull(productId);
    await user.save();

    res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    // we're using populate, bc wishlist is just an array of product ids
    const user = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProfile(req, res) {
  try {
    const user = req.user;

    res.status(200).json({ 
      user: {
        name: user.name,
        imageUrl: user.imageUrl,
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
      }
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { firstName, lastName, imageUrl } = req.body;
    const user = req.user;

    // Update name if provided
    if (firstName !== undefined || lastName !== undefined) {
      const currentName = user.name || "";
      const nameParts = currentName.split(" ");
      const newFirstName = firstName !== undefined ? firstName : (nameParts[0] || "");
      const newLastName = lastName !== undefined ? lastName : (nameParts.slice(1).join(" ") || "");
      user.name = `${newFirstName} ${newLastName}`.trim();
    }

    // Update imageUrl if provided
    if (imageUrl !== undefined) {
      user.imageUrl = imageUrl;
    }

    await user.save();

    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: {
        name: user.name,
        imageUrl: user.imageUrl,
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function uploadProfileImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const user = req.user;

    // Delete old image from Cloudinary if exists
    if (user.imageUrl) {
      try {
        const publicId = user.imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`profiles/${publicId}`);
        }
      } catch (error) {
        console.error("Error deleting old image:", error);
        // Continue even if deletion fails
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "profiles",
    });

    user.imageUrl = uploadResult.secure_url;
    await user.save();

    res.status(200).json({ 
      message: "Profile image uploaded successfully", 
      imageUrl: uploadResult.secure_url 
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
