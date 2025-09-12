import { useState, useEffect } from "react";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import useUser from "../services/UserContext";

function MentorCodeReviews({ mentorId }) {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    line: "",
    comment: "",
    suggestion: "",
  });
  const { user } = useUser();
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLineClick = (lineNumber) => {
    setNewAnnotation({
      ...newAnnotation,
      line: lineNumber.toString(),
    });

    setTimeout(() => {
      const commentInput = document.getElementById("commentInput");
      if (commentInput) commentInput.focus();
    }, 100);
  };

  // Fetch assigned reviews
  const fetchReviews = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/mentor?mentorId=${user}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching reviews", err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchReviews();
    }
  }, [user, token]);

  // Fetch file content for code editor
  const fetchFileContent = async (reviewId) => {
    setFileLoading(true);
    setFileError("");

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/${reviewId}/file-content`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = res.data;

      if (!data.content) {
        // If the content is a URL, fetch the actual content
        if (data.contentUrl) {
          const contentRes = await axios.get(data.contentUrl);
          setFileContent(contentRes.data);
        } else {
          throw new Error("No file content available");
        }
      } else {
        // If the content is directly in the response
        setFileContent(data.content);
      }
    } catch (err) {
      console.error("Error fetching file content:", err);
      setFileError("Could not fetch file content");
    } finally {
      setFileLoading(false);
    }
  };

  // Fetch single review when selected
  const fetchReviewDetails = async (reviewId) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedReview(res.data);
      setAnnotations(res.data.annotations || []);

      // Fetch the file content for the editor
      await fetchFileContent(reviewId);
    } catch (err) {
      console.error("Error fetching review", err);
      alert("Error loading review details");
    }
  };

  // Handle adding a new annotation
  const addAnnotation = () => {
    if (!newAnnotation.line || !newAnnotation.comment) {
      alert("Please enter both line number and comment");
      return;
    }

    const annotation = {
      line: parseInt(newAnnotation.line),
      comment: newAnnotation.comment,
      suggestion: newAnnotation.suggestion || "",
    };

    setAnnotations([...annotations, annotation]);
    setNewAnnotation({ line: "", comment: "", suggestion: "" });
  };

  // Submit annotations to backend
  const submitAnnotations = async () => {
    if (!selectedReview) return;
    setLoading(true);

    try {
      const initialAnnotations = selectedReview.annotations || [];
      const newAnnotations = annotations.filter(
        (newAnn) =>
          !initialAnnotations.some(
            (initialAnn) =>
              initialAnn.line === newAnn.line &&
              initialAnn.comment === newAnn.comment
          )
      );

      if (newAnnotations.length === 0) {
        alert("No new annotations to submit!");
        setLoading(false);
        return;
      }

      const res = await axios.patch(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/${selectedReview.reviewId}/annotate`,
        { annotations: newAnnotations },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("New annotations submitted successfully!");

      setSelectedReview({
        ...selectedReview,
        annotations: [...initialAnnotations, ...newAnnotations],
      });

      fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Error submitting annotations");
    } finally {
      setLoading(false);
    }
  };

  // Mark review as completed
  const completeReview = async () => {
    if (!selectedReview) return;
    try {
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/${selectedReview.reviewId}/complete`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Review marked as completed!");
      setSelectedReview(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Error marking review as completed");
    }
  };

  const handleCloseEditor = () => {
    setSelectedReview(null);
    setFileContent("");
    setFileError("");
    setAnnotations([]);
  };

  // Check if a URL is a GitHub repository URL
  const isGitHubRepoUrl = (url) => {
    return url && url.includes("github.com");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {selectedReview ? (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2>Code Review: {selectedReview.repoUrl || "Uploaded File"}</h2>
            <button
              onClick={handleCloseEditor}
              style={{
                padding: "8px 16px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close Editor
            </button>
          </div>

          {fileLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div>Loading file content...</div>
            </div>
          ) : fileError ? (
            <div style={{ color: "red", padding: "20px", textAlign: "center" }}>
              {fileError}
            </div>
          ) : (
            <div
              style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
            >
              {/* Code Editor Section */}
              <div style={{ flex: 2 }}>
                <CodeEditor
                  content={fileContent}
                  reviewId={selectedReview.reviewId}
                  mentorId={selectedReview.mentorId}
                  readonly={false}
                  annotations={annotations}
                  onLineClick={handleLineClick}
                />
              </div>

              {/* Annotations Sidebar */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  minWidth: "300px",
                }}
              >
                <h3>Annotations</h3>

                {/* Add New Annotation Form */}
                <div style={{ marginBottom: "20px" }}>
                  <h4>Add New Annotation</h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label>Line Number:</label>
                      <input
                        type="number"
                        value={newAnnotation.line}
                        onChange={(e) =>
                          setNewAnnotation({
                            ...newAnnotation,
                            line: e.target.value,
                          })
                        }
                        placeholder="Click on a line in the editor"
                        style={{
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          width: "100%",
                        }}
                        disabled
                      />
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "4px",
                        }}
                      >
                        Click on any line in the code editor to select it
                      </div>
                    </div>

                    <div>
                      <label>Comment:</label>
                      <textarea
                        id="commentInput"
                        value={newAnnotation.comment}
                        onChange={(e) =>
                          setNewAnnotation({
                            ...newAnnotation,
                            comment: e.target.value,
                          })
                        }
                        placeholder="Enter your comment"
                        style={{
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          width: "100%",
                          minHeight: "80px",
                        }}
                      />
                    </div>

                    <div>
                      <label>Suggestion (Optional):</label>
                      <textarea
                        value={newAnnotation.suggestion}
                        onChange={(e) =>
                          setNewAnnotation({
                            ...newAnnotation,
                            suggestion: e.target.value,
                          })
                        }
                        placeholder="Enter your suggestion"
                        style={{
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          width: "100%",
                          minHeight: "60px",
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={addAnnotation}
                    disabled={!newAnnotation.line || !newAnnotation.comment}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      background:
                        !newAnnotation.line || !newAnnotation.comment
                          ? "#6c757d"
                          : "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        !newAnnotation.line || !newAnnotation.comment
                          ? "not-allowed"
                          : "pointer",
                      width: "100%",
                    }}
                  >
                    Add Annotation
                  </button>
                </div>

                {/* Current Annotations */}
                {annotations.length > 0 ? (
                  <div>
                    <h4>Current Annotations ({annotations.length})</h4>
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {annotations.map((annotation, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "10px",
                            marginBottom: "10px",
                            background: "white",
                            borderRadius: "4px",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          <div style={{ fontWeight: "bold", color: "#007bff" }}>
                            Line {annotation.line}:
                          </div>
                          <div style={{ marginTop: "5px", color: "#495057" }}>
                            {annotation.comment}
                          </div>
                          {annotation.suggestion && (
                            <div
                              style={{
                                marginTop: "5px",
                                padding: "5px",
                                background: "#e7f4e4",
                                borderRadius: "3px",
                                fontSize: "14px",
                              }}
                            >
                              <strong>Suggestion:</strong>{" "}
                              {annotation.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={submitAnnotations}
                        disabled={loading || annotations.length === 0}
                        style={{
                          padding: "10px 20px",
                          background:
                            loading || annotations.length === 0
                              ? "#6c757d"
                              : "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            loading || annotations.length === 0
                              ? "not-allowed"
                              : "pointer",
                          flex: 1,
                        }}
                      >
                        {loading ? "Submitting..." : "Submit All Annotations"}
                      </button>
                      <button
                        onClick={completeReview}
                        style={{
                          padding: "10px 20px",
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          flex: 1,
                        }}
                      >
                        Mark as Completed
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>
                    No annotations yet. Click on a line in the editor and add
                    your feedback.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "30px",
            }}
          >
            <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>
              Assigned Code Reviews
            </h2>

            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  background: "white",
                  borderRadius: "8px",
                  color: "#6c757d",
                }}
              >
                No code reviews assigned to you yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {reviews.map((review) => (
                  <div
                    key={review.reviewId}
                    style={{
                      padding: "20px",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      background: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "15px",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            background:
                              review.status === "pending"
                                ? "#fff3cd"
                                : review.status === "in-progress"
                                ? "#d1ecf1"
                                : review.status === "completed"
                                ? "#d4edda"
                                : "#f8d7da",
                            color:
                              review.status === "pending"
                                ? "#856404"
                                : review.status === "in-progress"
                                ? "#0c5460"
                                : review.status === "completed"
                                ? "#155724"
                                : "#721c24",
                          }}
                        >
                          {review.status?.toUpperCase() || "UNKNOWN"}
                        </strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>
                        Mentee: {review.menteeId || "Not specified"}
                      </div>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <strong>Repository:</strong>{" "}
                      {review.repoUrl || "File upload"}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "15px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => fetchReviewDetails(review.reviewId)}
                        disabled={!review.reviewId}
                        style={{
                          padding: "8px 16px",
                          background: review.reviewId ? "#007bff" : "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: review.reviewId ? "pointer" : "not-allowed",
                          fontSize: "14px",
                        }}
                      >
                        {review.reviewId ? "Open in Editor" : "Not available"}
                      </button>

                      {review.repoUrl && isGitHubRepoUrl(review.repoUrl) && (
                        <a
                          href={review.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "8px 16px",
                            background: "#6f42c1",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          View on GitHub
                        </a>
                      )}
                    </div>

                    {review.annotations && review.annotations.length > 0 && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "15px",
                          background: "#f8f9fa",
                          borderRadius: "4px",
                          borderLeft: "4px solid #007bff",
                        }}
                      >
                        <strong
                          style={{ display: "block", marginBottom: "10px" }}
                        >
                          Existing Annotations:
                        </strong>
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {review.annotations.map((annotation, index) => (
                            <div
                              key={index}
                              style={{
                                padding: "10px",
                                marginBottom: "8px",
                                background: "white",
                                borderRadius: "4px",
                                border: "1px solid #dee2e6",
                              }}
                            >
                              <div
                                style={{ fontWeight: "bold", color: "#007bff" }}
                              >
                                Line {annotation.line}:
                              </div>
                              <div
                                style={{ marginTop: "5px", color: "#495057" }}
                              >
                                {annotation.comment}
                              </div>
                              {annotation.suggestion && (
                                <div
                                  style={{
                                    marginTop: "5px",
                                    padding: "5px",
                                    background: "#e7f4e4",
                                    borderRadius: "3px",
                                    fontSize: "14px",
                                  }}
                                >
                                  <strong>Suggestion:</strong>{" "}
                                  {annotation.suggestion}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MentorCodeReviews;
