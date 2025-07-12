// Function to set the current date
function setCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const today = new Date();
        const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
        dateElement.textContent = dateString;
    }
}

// Function to fetch data from a Netlify function
async function fetchFromNetlifyFunction(functionName) {
    try {
        const response = await fetch(`/.netlify/functions/${functionName}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        return data.records;
    } catch (error) {
        console.error(`Error fetching from ${functionName}:`, error);
        throw error;
    }
}

// Function to set user info
function setUserInfo(userName = '김도현') {
    const userInfoElement = document.querySelector('.user-info');
    if (userInfoElement) {
        userInfoElement.textContent = `사용자: ${userName}`;
    }
}


// Run initial setup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    setUserInfo();
});
