const codeReviewService = require("../services/code-review.service");
const { getFileSignedUrl } = require("../../aws");

// -----------------------
// MENTEE CONTROLLERS
// -----------------------

// Request a new code review
async function requestCodeReview(req, res) {
  try {
    const { menteeId, mentorId, repoUrl } = req.body;
    const file = req.file;

    const reviewId = await codeReviewService.createCodeReview({
      menteeId,
      mentorId,
      repoUrl,
      file,
    });

    res.status(201).json({ message: "Code review requested", reviewId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
}

// Get all reviews for a mentee
async function getMyReviews(req, res) {
  try {
    const menteeId = req.query.menteeId;
    const reviews = await codeReviewService.getReviewsByMentee(menteeId);
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
}

// Delete a code review
async function deleteReview(req, res) {
  try {
    const { id } = req.params;

    const result = await codeReviewService.deleteReviewById(id);
    if (!result) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Failed to delete review" });
  }
}

// -----------------------
// MENTOR CONTROLLERS
// -----------------------

// Get all reviews assigned to mentor
async function getAssignedReviews(req, res) {
  try {
    const mentorId = req.query.mentorId;
    const reviews = await codeReviewService.getReviewsByMentor(mentorId);
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
}

// Add annotations to a review
async function addAnnotations(req, res) {
  try {
    const { id } = req.params;
    const { annotations } = req.body;

    const result = await codeReviewService.addAnnotations(id, annotations);
    res.json({ message: "Annotations added", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
}

// Mark review as completed
async function completeReview(req, res) {
  try {
    const { id } = req.params;

    const result = await codeReviewService.markReviewComplete(id);
    res.json({ message: "Review marked completed", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
}

// -----------------------
// COMMON CONTROLLERS
// -----------------------

// Get single review with annotations
async function getReview(req, res) {
  try {
    const { id } = req.params;
    const review = await codeReviewService.getReviewById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
}

//Get the file content in s3 bucket
async function getFileContent(req, res) {
  try {
    const { reviewId } = req.params;

    const review = await codeReviewService.getReviewById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.diffFile)
      return res
        .status(404)
        .json({ message: "No file uploaded for this review" });

    let contentUrl;

    if (
      review.diffFile.startsWith(
        `https://skillbridge-code-reviews.s3.amazonaws.com/`
      )
    ) {
      const key = review.diffFile.split(
        "https://skillbridge-code-reviews.s3.amazonaws.com/"
      )[1];
      contentUrl = await getFileSignedUrl(key); // generate signed URL
    } else {
      contentUrl = review.diffFile; // use as is if already signed or public
    }

    return res.json({ contentUrl });
  } catch (err) {
    console.error("Error in getFileContent:", err);
    return res.status(500).json({ message: "Failed to fetch file content" });
  }
}

module.exports = {
  requestCodeReview,
  getMyReviews,
  getAssignedReviews,
  getReview,
  addAnnotations,
  completeReview,
  getFileContent,
  deleteReview,
};
