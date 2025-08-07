import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { User } from "../../types";

const TeamShowcase: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getRole = (name: string): string => {
    const roles: { [key: string]: string } = {
      "Bhushan Barun Mallick": "Leader",
      "Content Manager": "Content & Updates Manager",
      "Devesh Rahangdale": "Researcher",
      "Pranav Anand Deshpande": "Hardware Specialist",
      "Samiksha Wasnik": "Crafting",
      "Sneha Deherarkar": "Presentation Specialist",
      "Sneha Deharkar": "Presentation Specialist",
      "Ujwal Vilas Didhate": "PPT & Script",
      "Kanchan Rawat": "Presentation Head",
    };
    return roles[name] || "Member";
  };

  const getBio = (user: User): string => {
    const name = user.personalDetails.name;
    console.log("Getting bio for user:", name);
    
    // Special handling for admin/leader
    if (name === "Bhushan Barun Mallick") {
      const adminBio = "Visionary leader and tech enthusiast, driving innovation and fostering collaboration in the tech community. Passionate about creating platforms that empower developers and bring ideas to life.";
      console.log("Returning admin bio:", adminBio);
      return adminBio;
    }
    
    // Check if user has a custom bio from their profile
    if (user.personalDetails?.bio && user.personalDetails.bio.trim()) {
      console.log("Using custom bio from profile:", user.personalDetails.bio);
      return user.personalDetails.bio;
    }

    // Fallback to hardcoded bios for existing members
    const bios: { [key: string]: string } = {
      "Content Manager":
        "Experienced content and updates manager responsible for creating, editing, and publishing engaging content across all platforms. Manages blogs, photos, videos, and event updates to keep the community informed and engaged.",
      "Devesh Rahangdale":
        "Dedicated researcher with a passion for exploring cutting-edge technologies and finding innovative solutions to complex problems. Specializes in data analysis and emerging tech trends.",
      "Pranav Anand Deshpande":
        "Hardware specialist with expertise in embedded systems and IoT solutions. Brings technical depth and practical engineering skills to every project.",
      "Samiksha Wasnik":
        "Creative craftsperson with an eye for detail and design. Specializes in creating engaging visual content and user experiences that captivate audiences.",
      "Sneha Deherarkar":
        "Expert presentation specialist who handles and delivers compelling presentations with confidence and clarity. Specializes in transforming complex technical information into engaging, accessible presentations that captivate audiences and drive results.",
      "Sneha Deharkar":
        "Expert presentation specialist who handles and delivers compelling presentations with confidence and clarity. Specializes in transforming complex technical information into engaging, accessible presentations that captivate audiences and drive results.",
      "Ujwal Vilas Didhate":
        "Expert in presentation design and script writing. Creates compelling narratives and visual stories that effectively communicate project goals and achievements.",
      "Kanchan Rawat":
        "Presentation head with exceptional leadership skills in coordinating and managing presentation strategies. Ensures seamless delivery of all presentation activities.",
    };
    
    const fallbackBio = bios[name] || "Dedicated team member contributing to INFI X TECH's mission of innovation and excellence.";
    console.log("Using fallback bio for", name, ":", fallbackBio);
    return fallbackBio;
  };

  // Helper function to get profile photo URL based on name
  const getProfilePhotoUrl = (name: string): string => {
    // Clean the name to remove any extra spaces or invisible characters
    const cleanName = name.trim();

    // Exact mapping of names to photo files (case-sensitive)
    const photoMap: { [key: string]: string } = {
      "Bhushan Barun Mallick": "/assets/images/Bhushan.jpg",
      "Devesh Rahangdale": "/assets/images/team/devesh.jpg",
      "Pranav Anand Deshpande": "/assets/images/team/pranav.jpg",
      "Samiksha Wasnik": "/assets/images/team/samiksha.jpg",
      "Sneha Deherarkar": "/assets/images/team/sneha.jpg",
      "Sneha Deharkar": "/assets/images/team/sneha.jpg", // Alternative spelling
      "Ujwal Vilas Didhate": "/assets/images/team/ujwal.jpg",
      "Kanchan Rawat": "/assets/images/team/kanchan.jpg",
    };

    const photoUrl = photoMap[cleanName];

    if (photoUrl) {
      console.log(`📸 Photo found for "${cleanName}" → ${photoUrl}`);
      // Special logging for Sneha to debug the issue
      if (cleanName.includes("Sneha")) {
        console.log(
          `🔍 SNEHA DEBUG: Original="${name}", Clean="${cleanName}", PhotoURL="${photoUrl}"`
        );
      }
      return photoUrl;
    } else {
      console.warn(
        `⚠️ No photo mapping found for: "${name}" (cleaned: "${cleanName}")`
      );
      console.log("Available mappings:", Object.keys(photoMap));
      // Special logging for Sneha variations
      if (cleanName.includes("Sneha")) {
        console.error(
          `❌ SNEHA DEBUG: Failed to find mapping for "${cleanName}"`
        );
        console.log(
          "Original name length:",
          name.length,
          "Clean name length:",
          cleanName.length
        );
        console.log(
          "Name character codes:",
          Array.from(name).map((c) => c.charCodeAt(0))
        );
        console.log(
          "Sneha variations in map:",
          Object.keys(photoMap).filter((k) => k.includes("Sneha"))
        );
      }

      // Special handling for Sneha - try different variations
      if (cleanName.toLowerCase().includes("sneha")) {
        console.log("🔧 SNEHA FALLBACK: Trying alternative mappings...");
        // Try common variations
        const snehaVariations = [
          "Sneha Deharkar",
          "Sneha Deherarkar",
          "Sneha Deharkar",
          "Sneha Deherarkar",
        ];

        for (const variation of snehaVariations) {
          if (photoMap[variation]) {
            console.log(`✅ SNEHA FALLBACK: Found match with "${variation}"`);
            return photoMap[variation];
          }
        }

        // If still no match, force return Sneha's photo
        console.log("🔧 SNEHA FALLBACK: Force returning sneha.jpg");
        return "/assets/images/team/sneha.jpg";
      }

      // Create a simple SVG fallback with initials for other members
      const initials = cleanName
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase();
      const colors = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#06B6D4",
        "#84CC16",
      ];
      const colorIndex = cleanName.length % colors.length;
      const bgColor = colors[colorIndex];

      return `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="100" fill="${bgColor}"/>
          <text x="100" y="120" text-anchor="middle" fill="white" font-size="60" font-family="Arial, sans-serif" font-weight="bold">
            ${initials}
          </text>
        </svg>
      `)}`;
    }
  };

  const fetchTeamMembers = async () => {
    try {
      console.log("Fetching team members from Firebase...");

      // First try to fetch admin from Firebase
      let adminUser: User | null = null;
      try {
        const adminQuery = query(
          collection(db, "users"),
          where("role", "==", "admin")
        );
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          const adminData = adminDoc.data();
          adminUser = {
            ...adminData,
            uid: adminDoc.id,
            personalDetails: {
              ...adminData.personalDetails,
              name: "Bhushan Barun Mallick",
              bio: adminData.personalDetails?.bio || "Visionary leader and tech enthusiast, driving innovation and fostering collaboration in the tech community. Passionate about creating platforms that empower developers and bring ideas to life."
            },
            createdAt: adminData.createdAt?.toDate() || new Date(),
            updatedAt: adminData.updatedAt?.toDate() || new Date(),
            isActive:
              adminData.isActive !== undefined ? adminData.isActive : true,
            socialLinks: adminData.socialLinks || {
              linkedin: "https://www.linkedin.com/in/bhushan-mallick/",
              github: "https://github.com/CyberSleuth-Bhushan",
              twitter: "https://x.com/BhushanMallick6",
              instagram: "https://www.instagram.com/bhushan.98_xz_/",
            },
            profilePhotoUrl: "/assets/images/Bhushan.jpg",
          } as User;
          console.log(
            "Admin fetched from Firebase:",
            adminUser.personalDetails.name
          );
        }
      } catch (adminError) {
        console.log("Could not fetch admin from Firebase, using fallback");
      }

      // Fallback admin if not found in Firebase
      if (!adminUser) {
        adminUser = {
          uid: "admin-bhushan",
          email: "bhushanmallick2006@gmail.com",
          role: "admin",
          personalDetails: {
            name: "Bhushan Barun Mallick",
            phone: "+91-7666193374",
            dob: "1998-02-23",
            bio: "Visionary leader and tech enthusiast, driving innovation and fostering collaboration in the tech community. Passionate about creating platforms that empower developers and bring ideas to life."
          },
          educationalDetails: {
            institution:
              "Tulsiramji Gaikwad-Patil College Of Engineering & Technology",
            course: "Information Technology",
            year: "2024",
          },
          customId: "LIXT-0000",
          isFirstLogin: false,
          profilePhotoUrl: "/assets/images/Bhushan.jpg",
          socialLinks: {
            linkedin: "https://www.linkedin.com/in/bhushan-mallick/",
            github: "https://github.com/CyberSleuth-Bhushan",
            twitter: "https://x.com/BhushanMallick6",
            instagram: "https://www.instagram.com/bhushan.98_xz_/",
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      console.log("Final admin user:", adminUser);
      console.log("Admin name:", adminUser?.personalDetails?.name);
      console.log("Admin photo URL:", adminUser?.profilePhotoUrl);
      console.log("Admin bio from getBio:", getBio(adminUser!));
      console.log("Admin personalDetails:", adminUser?.personalDetails);
      setAdmin(adminUser);

      // Fetch members and managers from Firebase
      try {
        const membersQuery = query(
          collection(db, "users"),
          where("role", "in", ["member", "manager"])
        );
        const membersSnapshot = await getDocs(membersQuery);

        console.log(
          "Firebase query result:",
          membersSnapshot.size,
          "members and managers found"
        );

        let membersData: User[] = [];

        if (!membersSnapshot.empty) {
          membersData = membersSnapshot.docs.map((doc) => {
            const data = doc.data();
            console.log(
              "Processing member/manager:",
              data.personalDetails?.name,
              "ID:",
              data.customId,
              "Joined:",
              data.createdAt?.toDate()
            );

            return {
              ...data,
              uid: doc.id,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              isActive: data.isActive !== undefined ? data.isActive : true,
              socialLinks: data.socialLinks || {},
              // Use local team photos for better display
              profilePhotoUrl: getProfilePhotoUrl(
                data.personalDetails?.name || ""
              ),
            };
          }) as User[];

          console.log("Firebase members data processed:", membersData.length);
        }

        // Always prioritize Firebase data if available
        if (membersData.length > 0) {
          // Sort members by customId to ensure proper sequence
          const sortedMembers = membersData.sort((a, b) => {
            const aId = parseInt(a.customId?.split("-")[1] || "999");
            const bId = parseInt(b.customId?.split("-")[1] || "999");
            return aId - bId;
          });

          console.log(
            "Using Firebase data for",
            sortedMembers.length,
            "members/managers"
          );
          setMembers(sortedMembers);
        } else {
          console.log("No members found in Firebase, using fallback data");
          // Fallback to pre-defined team members in proper sequence
          const teamMembers: User[] = [
            // Manager - Content & Updates Manager (XMIXT-0101)
            {
              uid: "manager-content",
              email: "manager@infixttech.com",
              role: "manager",
              personalDetails: {
                name: "Content Manager",
                phone: "+91-XXXXXXXXXX",
                dob: "1999-XX-XX",
              },
              educationalDetails: {
                institution: "INFI X TECH",
                course: "Content & Updates Management",
                year: "2024",
              },
              customId: "XMIXT-0101",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Content Manager"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            // 1. Devesh Rahangdale - Researcher (MIXT-0001)
            {
              uid: "36W0ap1cFUP8D5AvBxX4MTGso8Y2",
              email: "deveshrahangdale748@gmail.com",
              role: "member",
              personalDetails: {
                name: "Devesh Rahangdale",
                phone: "+91-9579580341",
                dob: "1999-04-25",
              },
              educationalDetails: {
                institution:
                  "Tulsiramji Gaikwad-Patil College Of Engineering & Technology",
                course: "Research",
                year: "2028",
              },
              customId: "MIXT-0001",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Devesh Rahangdale"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uid: "member-pranav",
              email: "pranavdeshpande1374@gmail.com",
              role: "member",
              personalDetails: {
                name: "Pranav Anand Deshpande",
                phone: "+91-XXXXXXXXXX",
                dob: "1999-XX-XX",
              },
              educationalDetails: {
                institution:
                  "Tulsiramji Gaikwad-Patil College Of Engineering & Technology",
                course: "Hardware Engineering",
                year: "2024",
              },
              customId: "MIXT-0002",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Pranav Anand Deshpande"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uid: "member-samiksha",
              email: "samiksha@infixttech.com",
              role: "member",
              personalDetails: {
                name: "Samiksha Wasnik",
                phone: "+91-XXXXXXXXXX",
                dob: "1999-XX-XX",
              },
              educationalDetails: {
                institution: "Your Institution",
                course: "Design & Crafting",
                year: "2024",
              },
              customId: "MIXT-0003",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Samiksha Wasnik"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uid: "member-sneha",
              email: "sneha@infixttech.com",
              role: "member",
              personalDetails: {
                name: "Sneha Deharkar",
                phone: "+91-XXXXXXXXXX",
                dob: "1999-XX-XX",
              },
              educationalDetails: {
                institution: "Your Institution",
                course: "Presentation & Communication",
                year: "2024",
              },
              customId: "MIXT-0004",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Sneha Deharkar"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uid: "7EZDnanAreVBrsxGe3fzBIwwA1Y2",
              email: "ujwaldidhate@gmail.com",
              role: "member",
              personalDetails: {
                name: "Ujwal Vilas Didhate",
                phone: "+91-XXXXXXXXXX",
                dob: "1999-XX-XX",
              },
              educationalDetails: {
                institution: "Your Institution",
                course: "PPT & Script Writing",
                year: "2024",
              },
              customId: "MIXT-0005",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Ujwal Vilas Didhate"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uid: "member-kanchan",
              email: "kanchan@infixttech.com",
              role: "member",
              personalDetails: {
                name: "Kanchan Rawat",
                phone: "+91-XXXXXXXXXX",
                dob: "1999-XX-XX",
              },
              educationalDetails: {
                institution: "Your Institution",
                course: "Presentation Management",
                year: "2024",
              },
              customId: "MIXT-0006",
              isFirstLogin: false,
              profilePhotoUrl: getProfilePhotoUrl("Kanchan Rawat"),
              isActive: true,
              socialLinks: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];

          setMembers(teamMembers);
        }
      } catch (firebaseError) {
        console.error("Firebase error, using fallback data:", firebaseError);
        // If Firebase fails, always show fallback data
        const teamMembers: User[] = [
          {
            uid: "36W0ap1cFUP8D5AvBxX4MTGso8Y2",
            email: "deveshrahangdale748@gmail.com",
            role: "member",
            personalDetails: {
              name: "Devesh Rahangdale",
              phone: "+91-9579580341",
              dob: "1999-04-25",
            },
            educationalDetails: {
              institution:
                "Tulsiramji Gaikwad-Patil College Of Engineering & Technology",
              course: "Research",
              year: "2028",
            },
            customId: "MIXT-0001",
            isFirstLogin: false,
            profilePhotoUrl: getProfilePhotoUrl("Devesh Rahangdale"),
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            uid: "member-pranav",
            email: "pranavdeshpande1374@gmail.com",
            role: "member",
            personalDetails: {
              name: "Pranav Anand Deshpande",
              phone: "+91-XXXXXXXXXX",
              dob: "1999-XX-XX",
            },
            educationalDetails: {
              institution:
                "Tulsiramji Gaikwad-Patil College Of Engineering & Technology",
              course: "Hardware Engineering",
              year: "2024",
            },
            customId: "MIXT-0002",
            isFirstLogin: false,
            profilePhotoUrl: getProfilePhotoUrl("Pranav Anand Deshpande"),
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            uid: "member-samiksha",
            email: "samiksha@infixttech.com",
            role: "member",
            personalDetails: {
              name: "Samiksha Wasnik",
              phone: "+91-XXXXXXXXXX",
              dob: "1999-XX-XX",
            },
            educationalDetails: {
              institution: "Your Institution",
              course: "Design & Crafting",
              year: "2024",
            },
            customId: "MIXT-0003",
            isFirstLogin: false,
            profilePhotoUrl: getProfilePhotoUrl("Samiksha Wasnik"),
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            uid: "member-sneha",
            email: "sneha@infixttech.com",
            role: "member",
            personalDetails: {
              name: "Sneha Deharkar",
              phone: "+91-XXXXXXXXXX",
              dob: "1999-XX-XX",
            },
            educationalDetails: {
              institution: "Your Institution",
              course: "Presentation & Communication",
              year: "2024",
            },
            customId: "MIXT-0004",
            isFirstLogin: false,
            profilePhotoUrl: getProfilePhotoUrl("Sneha Deharkar"),
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            uid: "7EZDnanAreVBrsxGe3fzBIwwA1Y2",
            email: "ujwaldidhate@gmail.com",
            role: "member",
            personalDetails: {
              name: "Ujwal Vilas Didhate",
              phone: "+91-XXXXXXXXXX",
              dob: "1999-XX-XX",
            },
            educationalDetails: {
              institution: "Your Institution",
              course: "PPT & Script Writing",
              year: "2024",
            },
            customId: "MIXT-0005",
            isFirstLogin: false,
            profilePhotoUrl: getProfilePhotoUrl("Ujwal Vilas Didhate"),
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            uid: "member-kanchan",
            email: "kanchan@infixttech.com",
            role: "member",
            personalDetails: {
              name: "Kanchan Rawat",
              phone: "+91-XXXXXXXXXX",
              dob: "1999-XX-XX",
            },
            educationalDetails: {
              institution: "Your Institution",
              course: "Presentation Management",
              year: "2024",
            },
            customId: "MIXT-0006",
            isFirstLogin: false,
            profilePhotoUrl: getProfilePhotoUrl("Kanchan Rawat"),
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        setMembers(teamMembers);
      }
    } catch (error) {
      console.error("Error setting team members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Preload team photos to ensure they're available
    const preloadPhotos = () => {
      const photoUrls = [
        "/assets/images/Bhushan.jpg",
        "/assets/images/team/devesh.jpg",
        "/assets/images/team/pranav.jpg",
        "/assets/images/team/samiksha.jpg",
        "/assets/images/team/sneha.jpg",
        "/assets/images/team/ujwal.jpg",
        "/assets/images/team/kanchan.jpg",
      ];

      photoUrls.forEach((url) => {
        const img = new Image();
        img.onload = () => console.log(`✅ Preloaded: ${url}`);
        img.onerror = () => console.error(`❌ Failed to preload: ${url}`);
        img.src = url;
      });
    };

    preloadPhotos();
    fetchTeamMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        duration: 0.6,
      },
    },
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
          <p className="text-gray-600">Loading team members...</p>
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
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Meet Our Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-6"
          >
            The passionate individuals behind INFI X TECH, working together to
            create amazing experiences and drive innovation.
          </motion.p>


        </div>

        {/* Leader/Admin Section */}
        {admin && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-20"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Our Leader
              </h2>
              <p className="text-gray-600">
                Leading the vision and driving innovation
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 rounded-2xl p-8 text-white relative overflow-hidden">
                {/* Background Animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full"
                ></motion.div>

                <div className="relative z-10 grid md:grid-cols-3 gap-8 items-center">
                  {/* Profile Image */}
                  <div className="text-center md:text-left">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative inline-block"
                    >
                      <motion.img
                        src={admin.profilePhotoUrl}
                        alt={admin.personalDetails.name}
                        className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-2xl mx-auto"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.8,
                          type: "spring",
                          stiffness: 200,
                        }}
                        onLoad={() => {
                          console.log(
                            `✅ Admin photo loaded successfully: ${admin.personalDetails.name} - ${admin.profilePhotoUrl}`
                          );
                        }}
                        onError={(e) => {
                          console.error(
                            `❌ Admin photo failed to load: ${admin.personalDetails.name} - ${admin.profilePhotoUrl}`
                          );

                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback =
                            target.nextElementSibling as HTMLDivElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div className="w-48 h-48 rounded-full bg-white bg-opacity-20 border-4 border-white shadow-2xl mx-auto items-center justify-center hidden">
                        <span className="text-6xl font-bold">BM</span>
                      </div>

                      {/* Status Indicator */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`absolute -bottom-2 -right-2 w-8 h-8 ${
                          admin.isActive ? "bg-green-400" : "bg-gray-400"
                        } rounded-full border-4 border-white shadow-lg`}
                        title={admin.isActive ? "Active" : "Inactive"}
                      ></motion.div>
                    </motion.div>
                  </div>

                  {/* Profile Info */}
                  <div className="md:col-span-2 text-center md:text-left">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl font-bold mb-2"
                    >
                      {admin.personalDetails.name}
                    </motion.h3>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-center md:justify-start space-x-4 mb-4"
                    >
                      <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                        Admin & Founder
                      </span>
                      <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                        {admin.customId}
                      </span>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-lg opacity-90 mb-6 leading-relaxed"
                    >
                      {getBio(admin)}
                    </motion.p>

                    {/* Social Links */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex justify-center md:justify-start space-x-4"
                    >
                      {admin.socialLinks &&
                        Object.entries(admin.socialLinks).map(
                          ([platform, url]) => {
                            if (!url) return null;

                            const socialConfig = {
                              linkedin: {
                                icon: (
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                ),
                                color: "hover:bg-blue-600",
                              },
                              github: {
                                icon: (
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                  </svg>
                                ),
                                color: "hover:bg-gray-800",
                              },
                              twitter: {
                                icon: (
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                  </svg>
                                ),
                                color: "hover:bg-blue-400",
                              },
                              instagram: {
                                icon: (
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                  </svg>
                                ),
                                color: "hover:bg-pink-600",
                              },
                            }[platform];

                            if (!socialConfig) return null;

                            return (
                              <motion.a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1, y: -3 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl hover:bg-white hover:bg-opacity-40 hover:shadow-lg transition-all duration-300 border border-white border-opacity-30 ${socialConfig.color}`}
                                title={
                                  platform.charAt(0).toUpperCase() +
                                  platform.slice(1)
                                }
                              >
                                <span className="filter drop-shadow-sm">
                                  {socialConfig.icon}
                                </span>
                              </motion.a>
                            );
                          }
                        )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* Team Members Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Team Members
            </h2>
            <p className="text-gray-600">
              The talented individuals who make it all possible
            </p>
          </motion.div>

          {members.length > 0 ? (
            <motion.div
              variants={containerVariants}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {members.map((member) => (
                <motion.div
                  key={member.uid}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-6 text-center">
                    {/* Profile Image */}
                    <div className="relative mb-4">
                      <img
                        src={member.profilePhotoUrl}
                        alt={member.personalDetails.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-primary-100"
                        onLoad={() => {
                          console.log(
                            `✅ Photo loaded successfully: ${member.personalDetails.name} - ${member.profilePhotoUrl}`
                          );
                        }}
                        onError={(e) => {
                          // Enhanced error logging
                          console.error(
                            `❌ Photo failed to load: ${member.personalDetails.name} - ${member.profilePhotoUrl}`
                          );

                          // Fallback to initials if image doesn't load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback =
                            target.nextElementSibling as HTMLDivElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-600 rounded-full mx-auto items-center justify-center border-4 border-primary-100 hidden">
                        <span className="text-2xl font-bold text-white">
                          {member.personalDetails.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Online Status */}
                      <motion.div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 ${
                          member.isActive ? "bg-green-400" : "bg-gray-400"
                        } rounded-full border-2 border-white shadow-lg`}
                        animate={member.isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        title={member.isActive ? "Active" : "Inactive"}
                      ></motion.div>
                    </div>

                    {/* Member Info */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {member.personalDetails.name}
                    </h3>

                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
                        {getRole(member.personalDetails.name)}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                        {member.customId}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {getBio(member)}
                    </p>

                    {/* Social Media Links */}
                    {member.socialLinks &&
                      Object.keys(member.socialLinks).some(
                        (key) =>
                          member.socialLinks![
                            key as keyof typeof member.socialLinks
                          ]
                      ) && (
                        <div className="flex justify-center space-x-3 mb-4">
                          {member.socialLinks.linkedin && (
                            <motion.a
                              href={member.socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all duration-300 shadow-lg"
                              title="LinkedIn"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </motion.a>
                          )}
                          {member.socialLinks.github && (
                            <motion.a
                              href={member.socialLinks.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-900 transition-all duration-300 shadow-lg"
                              title="GitHub"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                            </motion.a>
                          )}
                          {member.socialLinks.twitter && (
                            <motion.a
                              href={member.socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-all duration-300 shadow-lg"
                              title="Twitter"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                            </motion.a>
                          )}
                          {member.socialLinks.instagram && (
                            <motion.a
                              href={member.socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition-all duration-300 shadow-lg"
                              title="Instagram"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            </motion.a>
                          )}
                          {member.socialLinks.portfolio && (
                            <motion.a
                              href={member.socialLinks.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-all duration-300 shadow-lg"
                              title="Portfolio"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </motion.a>
                          )}
                        </div>
                      )}

                    <p className="text-gray-500 text-xs">
                      Joined {member.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Building Our Team
              </h3>
              <p className="text-gray-600 mb-6">
                We're growing our team of passionate individuals. Stay tuned for
                updates!
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* Join Team CTA */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mt-20"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-center text-white"
          >
            <h3 className="text-3xl font-bold mb-4">Want to Join Our Team?</h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              We're always looking for passionate individuals who share our
              vision of innovation and collaboration. Get in touch if you'd like
              to be part of our journey.
            </p>
            <motion.a
              href="mailto:official.infixtech@gmail.com"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
            >
              Get In Touch
            </motion.a>
          </motion.div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default TeamShowcase;
