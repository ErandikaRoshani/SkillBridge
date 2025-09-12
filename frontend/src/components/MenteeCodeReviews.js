import { useState, useEffect } from "react";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import useUser from "../services/UserContext";

function MenteeCodeReviews({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [diffFile, setDiffFile] = useState(null);
  const [mentorId, setMentorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState("url");
  const [selectedReview, setSelectedReview] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useUser();
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Fetch mentee reviews
  const fetchReviews = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/me?menteeId=${user}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching reviews", err);
      setFileError("Failed to load reviews");
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

  // Delete a code review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this code review?")) {
      return;
    }

    setDeletingId(reviewId);
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Remove the deleted review from the state
      setReviews(reviews.filter((review) => review.reviewId !== reviewId));
    } catch (err) {
      console.error("Error deleting review", err);
      alert("Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  // Submit new code review request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mentorId) {
      alert("Please enter mentor ID");
      return;
    }

    if (selectedOption === "url" && !repoUrl) {
      alert("Please enter repository URL");
      return;
    }

    if (selectedOption === "file" && !diffFile) {
      alert("Please upload a file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("menteeId", user);
      formData.append("mentorId", mentorId);

      if (selectedOption === "url" && repoUrl) {
        formData.append("repoUrl", repoUrl);
      }

      if (selectedOption === "file" && diffFile) {
        formData.append("diffFile", diffFile);
      }

      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_CODE_REVIEW_SERVICE_URL}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRepoUrl("");
      setDiffFile(null);
      setMentorId("");
      await fetchReviews();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit review request");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (review) => {
    if (review.reviewId) {
      setSelectedReview(review);
      await fetchFileContent(review.reviewId);
    }
  };

  const handleCloseEditor = () => {
    setSelectedReview(null);
    setFileContent("");
    setFileError("");
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
                  readonly={true}
                  annotations={selectedReview.annotations || []}
                />
              </div>

              {/* Annotations Sidebar (Readonly) */}
              {selectedReview.annotations &&
                selectedReview.annotations.length > 0 && (
                  <div
                    style={{
                      flex: 1,
                      padding: "20px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      minWidth: "300px",
                    }}
                  >
                    <h3>Mentor Feedback</h3>

                    <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                      {selectedReview.annotations.map((annotation, index) => (
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
                  </div>
                )}
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
              Request Code Review
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Mentor ID:
                </label>
                <input
                  type="text"
                  placeholder="Enter mentor's user ID"
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "10px",
                    display: "block",
                  }}
                >
                  Select Input Method:
                </label>
                <div
                  style={{ display: "flex", gap: "20px", marginBottom: "15px" }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      value="url"
                      checked={selectedOption === "url"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      style={{ marginRight: "8px" }}
                    />
                    GitHub Repository URL
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      value="file"
                      checked={selectedOption === "file"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      style={{ marginRight: "8px" }}
                    />
                    File Upload
                  </label>
                </div>

                {selectedOption === "url" && (
                  <div>
                    <input
                      type="text"
                      placeholder="GitHub Repo URL (e.g., https://github.com/username/repo)"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      style={{
                        width: "100%",
                        maxWidth: "500px",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                )}

                {selectedOption === "file" && (
                  <div>
                    <input
                      type="file"
                      onChange={(e) => setDiffFile(e.target.files[0])}
                      accept=".diff,.patch,.txt,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.scss,.json,.md"
                      style={{
                        padding: "10px",
                        border: "1px dashed #ddd",
                        borderRadius: "4px",
                        width: "100%",
                        maxWidth: "500px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "5px",
                      }}
                    >
                      Accepted formats: .diff, .patch, .txt, code files (.js,
                      .py, .java, etc.)
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  background: loading ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {loading ? "Submitting..." : "Request Review"}
              </button>
            </form>
          </div>

          <div>
            <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>
              My Code Reviews
            </h2>

            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  color: "#6c757d",
                }}
              >
                No code reviews yet. Submit your first review request above!
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
                      position: "relative",
                    }}
                  >
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteReview(review.reviewId)}
                      disabled={deletingId === review.reviewId}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        padding: "5px 10px",
                        background:
                          deletingId === review.reviewId
                            ? "#6c757d"
                            : "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          deletingId === review.reviewId
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {deletingId === review.reviewId
                        ? "Deleting..."
                        : "Delete"}
                    </button>

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
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          marginTop: "20px",
                        }}
                      >
                        Mentor: {review.mentorId || "Not assigned"}
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
                      {review.diffFile && (
                        <button
                          onClick={() => handleViewFile(review)}
                          disabled={!review.reviewId}
                          style={{
                            padding: "8px 16px",
                            background: review.reviewId ? "#28a745" : "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: review.reviewId ? "pointer" : "not-allowed",
                            fontSize: "14px",
                          }}
                        >
                          {review.reviewId
                            ? "View Code in Editor"
                            : "File not available"}
                        </button>
                      )}

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
                          Mentor Feedback:
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

export default MenteeCodeReviews;
