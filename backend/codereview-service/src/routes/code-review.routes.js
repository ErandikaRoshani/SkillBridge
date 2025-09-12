const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const codeReviewController = require("../controllers/code-review.contoller");

// -----------------------
// MENTEE ROUTES
// -----------------------

// Request a code review
router.post(
  "/",
  upload.single("diffFile"),
  codeReviewController.requestCodeReview
);

// Get reviews for logged-in mentee
router.get("/me", codeReviewController.getMyReviews);

// Delete a review
router.delete("/:id", codeReviewController.deleteReview);

// -----------------------
// MENTOR ROUTES
// -----------------------

// Get reviews assigned to logged in mentor
router.get("/mentor", codeReviewController.getAssignedReviews);

// Add annotations
router.patch("/:id/annotate", codeReviewController.addAnnotations);

// Mark review completed
router.patch("/:id/complete", codeReviewController.completeReview);

// -----------------------
// COMMON ROUTES
// -----------------------

// Get single review
router.get("/:id", codeReviewController.getReview);

// Get file content for a review
router.get("/:reviewId/file-content", codeReviewController.getFileContent);

module.exports = router;
