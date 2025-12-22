document.addEventListener('DOMContentLoaded', () => {
    const fetchUserBtn = document.getElementById('fetchUserBtn');
    const userInfoDiv = document.getElementById('userInfo');

    fetchUserBtn.addEventListener('click', fetchRandomUser);

    async function fetchRandomUser() {
        userInfoDiv.innerHTML = '<p>Loading...</p>';
        fetchUserBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/api/random-user');
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();
            displayUserInfo(userData);
        } catch (error) {
            userInfoDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            console.error('Fetch error:', error);
        } finally {
            fetchUserBtn.disabled = false;
        }
    }

    function displayUserInfo(user) {
        const countryDetails = user.countryDetails || {};
        const exchangeRates = user.exchangeRates;
        const newsHeadlines = user.newsHeadlines;
        
        const flagHTML = countryDetails.flag ? 
            `<img src="${countryDetails.flag}" alt="${countryDetails.countryName} flag" class="country-flag">` : 
            '<p style="color: gray; font-style: italic;">Flag not available</p>';

        let exchangeHTML = '';
        if (exchangeRates && exchangeRates.baseCurrency) {
            const usdRate = typeof exchangeRates.usdRate === 'number' ? 
                exchangeRates.usdRate.toFixed(2) : exchangeRates.usdRate;
            const kztRate = typeof exchangeRates.kztRate === 'number' ? 
                exchangeRates.kztRate.toFixed(2) : exchangeRates.kztRate;

            exchangeHTML = `
                <div class="detail-item exchange-item">
                    <strong>Exchange Rates:</strong>
                    <div class="exchange-details">
                        1 ${exchangeRates.baseCurrency} = ${usdRate} USD<br>
                        1 ${exchangeRates.baseCurrency} = ${kztRate} KZT
                    </div>
                </div>
            `;
        }

        let newsHTML = '';
        if (newsHeadlines && newsHeadlines.length > 0) {
            const newsItems = newsHeadlines.map(article => {
                const imageHTML = article.image ? 
                    `<img src="${article.image}" alt="News image" class="news-image">` : 
                    '<div class="news-no-image">No image available</div>';
                
                return `
                    <div class="news-item">
                        ${imageHTML}
                        <div class="news-content">
                            <h4 class="news-title">${article.title}</h4>
                            <p class="news-description">${article.description}</p>
                            <a href="${article.url}" target="_blank" class="news-link">Read full article →</a>
                        </div>
                    </div>
                `;
            }).join('');

            newsHTML = `
                <div class="news-section">
                    <h3>Latest News from ${user.country}</h3>
                    ${newsItems}
                </div>
            `;
        } else {
            newsHTML = `
                <div class="news-section">
                    <h3>Latest News from ${user.country}</h3>
                    <p style="color: gray; font-style: italic;">No news available</p>
                </div>
            `;
        }

        userInfoDiv.innerHTML = `
            <div class="user-card">
                <img src="${user.profilePicture}" alt="${user.firstName} ${user.lastName}" class="profile-picture">
                
                <h2>${user.firstName} ${user.lastName}</h2>
                
                <div class="user-details">
                    <h3>Personal Information</h3>
                    <div class="detail-item">
                        <strong>Gender:</strong> ${user.gender}
                    </div>
                    
                    <div class="detail-item">
                        <strong>Age:</strong> ${user.age} years old
                    </div>
                    
                    <div class="detail-item">
                        <strong>Date of Birth:</strong> ${user.dateOfBirth}
                    </div>
                    
                    <div class="detail-item">
                        <strong>Full Address:</strong> ${user.fullAddress}
                    </div>
                    
                    <div class="detail-item">
                        <strong>City:</strong> ${user.city}
                    </div>
                    
                    <div class="detail-item">
                        <strong>Country:</strong> ${user.country}
                    </div>
                </div>

                <div class="country-details">
                    <h3>Country Information</h3>
                    
                    <div class="detail-item">
                        <strong>Country Name:</strong> ${countryDetails.countryName || 'N/A'}
                    </div>
                    
                    <div class="detail-item">
                        <strong>Capital City:</strong> ${countryDetails.capital || 'N/A'}
                    </div>
                    
                    <div class="detail-item">
                        <strong>Official Language(s):</strong> ${countryDetails.languages || 'N/A'}
                    </div>
                    
                    <div class="detail-item">
                        <strong>Currency:</strong> ${countryDetails.currency || 'N/A'}
                    </div>
                    
                    ${exchangeHTML}
                    
                    <div class="detail-item flag-container">
                        <strong>National Flag:</strong>
                        <div class="flag-wrapper">
                            ${flagHTML}
                        </div>
                    </div>
                </div>

                ${newsHTML}
            </div>
        `;
    }
});