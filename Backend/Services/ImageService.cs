namespace Backend.Services
{
    public class ImageService
    {
        private const int MAX_FILE_SIZE = 5242880; // 5MB
        private static readonly string[] ALLOWED_EXTENSIONS = { ".jpg", ".jpeg", ".png", ".webp" };
        private static readonly string[] PERMITTED_MIME_TYPES = { "image/jpeg", "image/png", "image/webp" };
        private static readonly string[] DEFAULT_IMAGES = { "default_profile.png", "default_group.png", "default_event.png" };

        public static async Task<string> ProcessImage(IFormFile image, string entityType, int entityId, string currentImageName = null)
        {
            // Ensure directory exists
            string imagesPath = Path.Combine(Directory.GetCurrentDirectory(), "uploadedImages");
            if (!Directory.Exists(imagesPath))
            {
                Directory.CreateDirectory(imagesPath);
            }

            // Validate file
            ValidateImage(image);

            // Get file extension
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

            // Generate unique filename
            string fileName = $"{entityType}_{entityId}_{DateTime.Now.Ticks}{extension}";
            string filePath = Path.Combine(imagesPath, fileName);

            // Save new image
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(fileStream);
            }

            // Delete old image if it exists and is not a default image
            if (!string.IsNullOrEmpty(currentImageName) && !IsDefaultImage(currentImageName))
            {
                DeleteImage(currentImageName);
            }

            return fileName;
        }

        public static void ValidateImage(IFormFile image)
        {
            if (image == null || image.Length == 0)
            {
                throw new ArgumentException("No image file provided");
            }

            if (image.Length > MAX_FILE_SIZE)
            {
                throw new ArgumentException("File size exceeds the limit (5MB)");
            }

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            var mimeType = image.ContentType;

            if (string.IsNullOrEmpty(extension) ||
                !ALLOWED_EXTENSIONS.Contains(extension) ||
                !PERMITTED_MIME_TYPES.Contains(mimeType))
            {
                throw new ArgumentException("Invalid file type. Only .jpg, .jpeg, .png and .webp files are allowed");
            }
        }

        public static void DeleteImage(string imageName)
        {
            try
            {
                // Don't delete default images
                if (string.IsNullOrEmpty(imageName) || IsDefaultImage(imageName))
                    return;

                string imagesPath = Path.Combine(Directory.GetCurrentDirectory(), "uploadedImages");

                // Handle paths that might include "/Images/"
                string fileName = imageName;
                if (imageName.Contains("/Images/"))
                {
                    fileName = Path.GetFileName(imageName.Replace("/Images/", ""));
                }

                string filePath = Path.Combine(imagesPath, fileName);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch
            {
                // Silently fail if image deletion fails
            }
        }

        public static bool IsDefaultImage(string imageName)
        {
            if (string.IsNullOrEmpty(imageName))
                return false;

            return DEFAULT_IMAGES.Any(defaultImage => imageName.Contains(defaultImage));
        }
    }
}
