document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Teilnehmerliste als HTML mit Delete-Icon und ohne Bullets
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section" style="margin-top: 16px;">
              <strong>Participants:</strong>
              <div class="participants-list" style="margin-top: 8px; margin-bottom: 0; padding-left: 0;">
                ${details.participants.map(p => `
                  <span class="participant-item" style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="flex:1;">${p}</span>
                    <button class="delete-participant-btn" title="Remove participant" data-activity="${name}" data-email="${p}" style="background: none; border: none; color: #c62828; cursor: pointer; font-size: 18px; margin-left: 8px;">
                      &#128465;
                    </button>
                  </span>
                `).join("")}
              </div>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section" style="margin-top: 16px;">
              <strong>Participants:</strong>
              <span class="no-participants" style="margin-left: 8px; color: #888;">No participants yet.</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Event Listener für Delete-Buttons
        activityCard.querySelectorAll('.delete-participant-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const activity = btn.getAttribute('data-activity');
            const email = btn.getAttribute('data-email');
            if (confirm(`Remove ${email} from ${activity}?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });
                const result = await response.json();
                if (response.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "An error occurred";
                  messageDiv.className = "error";
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
              } catch (error) {
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
              }
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Aktivitätenliste neu laden
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
