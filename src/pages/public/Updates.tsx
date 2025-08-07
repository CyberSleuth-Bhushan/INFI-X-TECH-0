import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Update } from "../../types";

const Updates: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "blog" | "photo" | "video" | "event-update"
  >("all");

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        console.log("Fetching published updates...");
        const updatesQuery = query(
          collection(db, "updates"),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc")
        );

        const querySnapshot = await getDocs(updatesQuery);
        console.log("Found", querySnapshot.size, "published updates");

        const updatesData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Processing published update:", doc.id, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            publishedAt: data.publishedAt?.toDate() || new Date(),
          };
        }) as Update[];

        console.log("Processed published updates:", updatesData);
        setUpdates(updatesData);
      } catch (error) {
        console.error("Error fetching updates:", error);
        // Try to fetch all updates if published query fails
        try {
          console.log("Fallback: Fetching all updates...");
          const allUpdatesQuery = query(
            collection(db, "updates"),
            orderBy("createdAt", "desc")
          );
          const allQuerySnapshot = await getDocs(allUpdatesQuery);
          const allUpdatesData = allQuerySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              publishedAt: doc.data().publishedAt?.toDate() || new Date(),
            }))
            .filter((update: any) => update.status === "published") as Update[];

          console.log("Fallback updates:", allUpdatesData);
          setUpdates(allUpdatesData);
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
          setUpdates([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  const filteredUpdates = updates.filter((update) => {
    if (filter === "all") return true;
    return update.type === filter;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blog":
        return "📝";
      case "photo":
        return "📸";
      case "video":
        return "🎥";
      case "event-update":
        return "🎉";
      default:
        return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "blog":
        return "bg-blue-100 text-blue-600";
      case "photo":
        return "bg-green-100 text-green-600";
      case "video":
        return "bg-purple-100 text-purple-600";
      case "event-update":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading updates...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-6 py-12"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Updates & Stories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with our latest events, achievements, and insights from
            the INFI X TECH community.
          </p>
        </div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {(["all", "event-update", "blog", "photo", "video"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center space-x-2 ${
                  filter === type
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600"
                }`}
              >
                <span>{getTypeIcon(type === "all" ? "blog" : type)}</span>
                <span>
                  {type === "all"
                    ? "All"
                    : type === "event-update"
                    ? "Events"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span className="text-sm">
                  (
                  {type === "all"
                    ? updates.length
                    : updates.filter((u) => u.type === type).length}
                  )
                </span>
              </button>
            )
          )}
        </motion.div>

        {/* Updates Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredUpdates.map((update) => (
              <motion.div
                key={update.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                {/* Media Preview */}
                {update.mediaUrls && update.mediaUrls.length > 0 && (
                  <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-50">
                        {getTypeIcon(update.type)}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                          update.type
                        )}`}
                      >
                        {update.type === "event-update"
                          ? "Event"
                          : update.type.charAt(0).toUpperCase() +
                            update.type.slice(1)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {!update.mediaUrls && (
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                          update.type
                        )}`}
                      >
                        {update.type === "event-update"
                          ? "Event"
                          : update.type.charAt(0).toUpperCase() +
                            update.type.slice(1)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {update.publishedAt?.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {update.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {update.content}
                  </p>

                  {/* Tags */}
                  {update.tags && update.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {update.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author and Date */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>By {update.authorName}</span>
                    <span>{update.publishedAt?.toLocaleDateString()}</span>
                  </div>

                  {/* Media Links */}
                  {update.mediaUrls && update.mediaUrls.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {update.mediaUrls.length} media file
                          {update.mediaUrls.length > 1 ? "s" : ""}
                        </span>
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View Media →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredUpdates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No updates found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === "all"
                ? "No updates have been published yet. Check back soon for exciting content!"
                : `No ${filter} updates available at the moment.`}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="btn-secondary"
              >
                View All Updates
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Updates;
