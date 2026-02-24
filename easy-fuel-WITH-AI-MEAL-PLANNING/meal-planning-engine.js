// ========================================
// MEAL PLANNING ENGINE
// ========================================

// Calorie burn rates per minute for different activities
const calorieRates = {
    rest: { low: 0, moderate: 0, high: 0 },
    strength: { low: 4, moderate: 6, high: 8 },
    cardio: { low: 8, moderate: 11, high: 14 },
    hiit: { low: 10, moderate: 13, high: 16 },
    yoga: { low: 2, moderate: 3, high: 4 },
    sports: { low: 6, moderate: 9, high: 12 }
};

// Meal database with macro profiles
const mealDatabase = {
    breakfast: [
        { name: "Oatmeal Power Bowl", protein: 35, carbs: 85, fat: 22, calories: 650, ingredients: ["1 cup oats (cooked)", "1 scoop vanilla protein powder", "1 banana, sliced", "2 tbsp almond butter", "1 tbsp honey", "Cinnamon to taste"] },
        { name: "Greek Yogurt Parfait", protein: 40, carbs: 60, fat: 15, calories: 525, ingredients: ["2 cups Greek yogurt", "1 cup granola", "1 cup mixed berries", "2 tbsp honey", "1/4 cup walnuts"] },
        { name: "Egg White Scramble", protein: 45, carbs: 50, fat: 18, calories: 530, ingredients: ["8 egg whites", "2 whole eggs", "1 cup spinach", "1/2 cup mushrooms", "2 slices whole wheat toast", "1 tbsp olive oil"] },
        { name: "Protein Pancakes", protein: 42, carbs: 75, fat: 16, calories: 600, ingredients: ["1.5 cups pancake mix", "2 scoops protein powder", "2 eggs", "1/4 cup blueberries", "2 tbsp maple syrup"] },
        { name: "Breakfast Burrito", protein: 38, carbs: 70, fat: 24, calories: 640, ingredients: ["3 eggs", "1/4 cup black beans", "1 large tortilla", "1/4 cup cheese", "1/2 avocado", "Salsa"] }
    ],
    preWorkout: [
        { name: "Quick Energy Boost", protein: 8, carbs: 35, fat: 11, calories: 250, ingredients: ["1 medium apple", "2 tbsp peanut butter", "1 rice cake"] },
        { name: "Banana Smoothie", protein: 15, carbs: 45, fat: 6, calories: 290, ingredients: ["1 banana", "1 scoop whey protein", "1 cup almond milk", "1 tbsp honey"] },
        { name: "Energy Bar & Fruit", protein: 10, carbs: 40, fat: 8, calories: 260, ingredients: ["1 protein bar", "1 medium orange"] },
        { name: "Toast & Berries", protein: 12, carbs: 42, fat: 7, calories: 270, ingredients: ["2 slices whole wheat bread", "1 tbsp almond butter", "1/2 cup blueberries"] }
    ],
    postWorkout: [
        { name: "Chicken & Rice Recovery", protein: 62, carbs: 75, fat: 18, calories: 750, ingredients: ["8 oz grilled chicken breast", "1.5 cups white rice", "1 cup steamed broccoli", "1 tbsp olive oil"] },
        { name: "Protein Shake + Rice", protein: 55, carbs: 80, fat: 12, calories: 680, ingredients: ["2 scoops whey protein", "2 cups chocolate milk", "1 banana", "1 cup cooked rice"] },
        { name: "Turkey & Sweet Potato", protein: 58, carbs: 70, fat: 16, calories: 700, ingredients: ["8 oz ground turkey", "1 large sweet potato", "1 cup green beans", "1 tbsp coconut oil"] },
        { name: "Salmon & Quinoa", protein: 50, carbs: 65, fat: 22, calories: 720, ingredients: ["6 oz salmon", "1.5 cups quinoa", "1 cup asparagus", "Lemon & herbs"] }
    ],
    dinner: [
        { name: "Salmon with Sweet Potato", protein: 45, carbs: 55, fat: 28, calories: 700, ingredients: ["6 oz grilled salmon", "1 large sweet potato", "2 cups mixed greens salad", "2 tbsp avocado oil dressing"] },
        { name: "Lean Beef & Vegetables", protein: 52, carbs: 45, fat: 25, calories: 680, ingredients: ["7 oz lean beef", "1 cup brown rice", "2 cups mixed vegetables", "1 tbsp olive oil"] },
        { name: "Chicken Stir-Fry", protein: 48, carbs: 60, fat: 20, calories: 680, ingredients: ["7 oz chicken breast", "2 cups mixed vegetables", "1 cup rice noodles", "Stir-fry sauce"] },
        { name: "Shrimp & Pasta", protein: 42, carbs: 70, fat: 18, calories: 650, ingredients: ["6 oz shrimp", "1.5 cups whole wheat pasta", "1/2 cup marinara sauce", "2 cups spinach", "Parmesan cheese"] },
        { name: "Turkey Meatballs", protein: 50, carbs: 58, fat: 22, calories: 690, ingredients: ["8 oz turkey meatballs", "1.5 cups pasta", "1/2 cup tomato sauce", "Side salad"] }
    ],
    snacks: [
        { name: "Protein Shake", protein: 25, carbs: 8, fat: 3, calories: 160, ingredients: ["1 scoop whey protein", "1 cup water"] },
        { name: "Greek Yogurt & Berries", protein: 20, carbs: 25, fat: 5, calories: 225, ingredients: ["1 cup Greek yogurt", "1/2 cup mixed berries"] },
        { name: "Trail Mix", protein: 8, carbs: 28, fat: 18, calories: 290, ingredients: ["1/4 cup almonds", "1/4 cup dried fruit", "1 tbsp dark chocolate chips"] }
    ]
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
function calculateBMR(weight, height, age, gender = 'male') {
    // weight in lbs, height in inches
    const weightKg = weight * 0.453592;
    const heightCm = height * 2.54;
    
    if (gender === 'male') {
        return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
}

// Calculate TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr, activityLevel) {
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extreme: 1.9
    };
    return bmr * (multipliers[activityLevel] || 1.55);
}

// Calculate calories burned from workout
function calculateWorkoutCalories(type, duration, intensity) {
    if (!type || type === 'rest' || !duration) return 0;
    const rate = calorieRates[type]?.[intensity] || 5;
    return Math.round(rate * duration);
}

// Calculate macro split based on workout type and intensity
function calculateMacros(totalCalories, workoutType, intensity, mode) {
    let proteinPercent, carbsPercent, fatPercent;
    
    if (workoutType === 'rest') {
        // Rest day: moderate carbs, higher fat
        proteinPercent = 30;
        carbsPercent = 35;
        fatPercent = 35;
    } else if (workoutType === 'strength') {
        // Strength: high protein, moderate-high carbs
        proteinPercent = 35;
        carbsPercent = 40;
        fatPercent = 25;
    } else if (workoutType === 'cardio' || workoutType === 'hiit') {
        // Cardio/HIIT: high carbs for energy
        proteinPercent = 25;
        carbsPercent = 50;
        fatPercent = 25;
    } else {
        // Default split
        proteinPercent = 30;
        carbsPercent = 40;
        fatPercent = 30;
    }
    
    return {
        protein: Math.round((totalCalories * proteinPercent / 100) / 4), // 4 cal per g
        carbs: Math.round((totalCalories * carbsPercent / 100) / 4),     // 4 cal per g
        fat: Math.round((totalCalories * fatPercent / 100) / 9)          // 9 cal per g
    };
}

// Select meals to hit macro targets
function selectMeals(targetCalories, targetMacros, workoutType, hasWorkout) {
    const meals = {};
    
    // Allocate calories across meals
    const breakfastCals = Math.round(targetCalories * 0.28);
    const dinnerCals = Math.round(targetCalories * 0.30);
    
    let remainingCals = targetCalories - breakfastCals - dinnerCals;
    
    // Select breakfast
    meals.breakfast = selectBestMeal(mealDatabase.breakfast, breakfastCals, 100);
    
    if (hasWorkout) {
        // Add pre and post workout meals
        const preWorkoutCals = Math.round(targetCalories * 0.12);
        const postWorkoutCals = Math.round(targetCalories * 0.30);
        
        meals.preWorkout = selectBestMeal(mealDatabase.preWorkout, preWorkoutCals, 60);
        meals.postWorkout = selectBestMeal(mealDatabase.postWorkout, postWorkoutCals, 120);
        
        remainingCals = targetCalories - breakfastCals - preWorkoutCals - postWorkoutCals - dinnerCals;
    }
    
    // Select dinner
    meals.dinner = selectBestMeal(mealDatabase.dinner, dinnerCals, 100);
    
    // Add snack if needed for remaining calories
    if (remainingCals > 150) {
        meals.snack = selectBestMeal(mealDatabase.snacks, remainingCals, 100);
    }
    
    return meals;
}

// Helper: Select best meal match for calorie target
function selectBestMeal(mealOptions, targetCals, tolerance) {
    let bestMeal = mealOptions[0];
    let smallestDiff = Math.abs(mealOptions[0].calories - targetCals);
    
    for (const meal of mealOptions) {
        const diff = Math.abs(meal.calories - targetCals);
        if (diff < smallestDiff && diff <= tolerance) {
            bestMeal = meal;
            smallestDiff = diff;
        }
    }
    
    return bestMeal;
}

// Main function: Generate complete meal plan
function generateMealPlan() {
    console.log('🎯 Starting meal plan generation...');
    
    // Get user data
    if (!currentUser || !currentUser.data) {
        alert('Please complete your profile first!');
        return;
    }
    
    const weight = parseInt(currentUser.data.weight) || 165;
    const height = parseInt(currentUser.data.height) || 68;
    const age = parseInt(currentUser.data.age) || 28;
    
    // Calculate base metabolic rate
    const bmr = calculateBMR(weight, height, age);
    const tdee = calculateTDEE(bmr, 'moderate');
    
    console.log('📊 BMR:', bmr, 'TDEE:', tdee);
    
    // Collect weekly schedule
    const weekSchedule = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const type = document.getElementById(`${day}-type`)?.value || 'rest';
        const duration = parseInt(document.getElementById(`${day}-duration`)?.value) || 0;
        const intensity = document.getElementById(`${day}-intensity`)?.value || 'moderate';
        const description = document.getElementById(`${day}-description`)?.value || '';
        
        const workoutCalories = calculateWorkoutCalories(type, duration, intensity);
        const totalCalories = Math.round(tdee + workoutCalories);
        const macros = calculateMacros(totalCalories, type, intensity, userMode);
        
        weekSchedule[day] = {
            workout: {
                type,
                duration,
                intensity,
                description,
                calories: workoutCalories
            },
            nutrition: {
                totalCalories,
                ...macros
            },
            meals: selectMeals(totalCalories, macros, type, type !== 'rest')
        };
    });
    
    console.log('📅 Week schedule generated:', weekSchedule);
    
    // Save to user data
    currentUser.data.weekSchedule = weekSchedule;
    currentUser.data.mealPlanGenerated = true;
    currentUser.data.lastGenerated = new Date().toISOString();
    saveUserData();
    
    // Update Home tab with today's plan
    updateHomePage();
    
    // Show success notification
    showNotification('✅ Meal plan generated!', 'Check the Home tab to see today\'s meals');
    
    // Switch to Home tab
    setTimeout(() => {
        switchTab('setup');
    }, 1500);
}

// Update Home page with today's meal plan
function updateHomePage() {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];
    
    if (!currentUser?.data?.weekSchedule) return;
    
    const todayPlan = currentUser.data.weekSchedule[todayName];
    if (!todayPlan) return;
    
    console.log('📱 Updating home page with:', todayName, todayPlan);
    
    // Update workout card
    const workoutEl = document.getElementById('todayWorkout');
    if (workoutEl && todayPlan.workout.type !== 'rest') {
        workoutEl.innerHTML = `
            <div style="padding: 1rem; background: var(--bg-dark); border-radius: 8px;">
                <div style="font-weight: 600; margin-bottom: 0.5rem; text-transform: capitalize;">
                    ${todayPlan.workout.type.replace('hiit', 'HIIT')} ${todayPlan.workout.type === 'strength' ? 'Training' : ''}
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${todayPlan.workout.duration} minutes • ${todayPlan.workout.intensity} intensity • ~${todayPlan.workout.calories} calories
                </div>
                ${todayPlan.workout.description ? `<div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem; font-style: italic;">${todayPlan.workout.description}</div>` : ''}
            </div>
        `;
    } else if (workoutEl) {
        workoutEl.innerHTML = `
            <div style="padding: 1rem; background: var(--bg-dark); border-radius: 8px; text-align: center;">
                <div style="font-weight: 600; color: var(--primary);">Rest Day 😌</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Recovery and regeneration</div>
            </div>
        `;
    }
    
    // Update meal cards
    const mealsEl = document.getElementById('todayMeals');
    if (!mealsEl) return;
    
    let mealsHTML = '';
    const mealIcons = {
        breakfast: '🌅',
        preWorkout: '⚡',
        postWorkout: '🍗',
        snack: '🍎',
        dinner: '🌙'
    };
    
    const mealTitles = {
        breakfast: 'Breakfast',
        preWorkout: 'Pre-Workout Snack',
        postWorkout: 'Post-Workout Meal',
        snack: 'Snack',
        dinner: 'Dinner'
    };
    
    Object.keys(todayPlan.meals).forEach(mealType => {
        const meal = todayPlan.meals[mealType];
        mealsHTML += `
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">${mealIcons[mealType] || '🍽️'}</div>
                    <h2 class="card-title">${mealTitles[mealType] || mealType}</h2>
                    <div style="margin-left: auto; font-family: 'JetBrains Mono', monospace; color: var(--primary); font-weight: 700;">
                        ${meal.calories} cal
                    </div>
                </div>
                <div style="padding: 1rem 0;">
                    <div style="margin-bottom: 1rem;">
                        <div style="font-weight: 600; font-size: 1.05rem; margin-bottom: 0.75rem;">${meal.name}</div>
                        <ul style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8; margin: 0; padding-left: 1.5rem;">
                            ${meal.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    <div style="display: flex; gap: 1.5rem; padding: 0.875rem; background: var(--bg-dark); border-radius: 8px; font-size: 0.95rem; font-family: 'JetBrains Mono', monospace;">
                        <div><strong style="color: var(--accent);">P:</strong> ${meal.protein}g</div>
                        <div><strong style="color: var(--accent-alt);">C:</strong> ${meal.carbs}g</div>
                        <div><strong style="color: var(--primary);">F:</strong> ${meal.fat}g</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    mealsEl.innerHTML = mealsHTML;
    
    // Update daily totals
    const totals = {
        calories: todayPlan.nutrition.totalCalories,
        protein: todayPlan.nutrition.protein,
        carbs: todayPlan.nutrition.carbs,
        fat: todayPlan.nutrition.fat
    };
    
    document.querySelector('#setup .card:last-child').innerHTML = `
        <div class="card-header">
            <div class="card-icon">📊</div>
            <h2 class="card-title" style="color: var(--bg-dark);">Daily Totals</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1.5rem; padding: 1rem 0;">
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: rgba(10,14,26,0.6); font-weight: 600; margin-bottom: 0.25rem;">CALORIES</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--bg-dark); font-family: 'JetBrains Mono', monospace;">${totals.calories}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: rgba(10,14,26,0.6); font-weight: 600; margin-bottom: 0.25rem;">PROTEIN</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--bg-dark); font-family: 'JetBrains Mono', monospace;">${totals.protein}g</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: rgba(10,14,26,0.6); font-weight: 600; margin-bottom: 0.25rem;">CARBS</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--bg-dark); font-family: 'JetBrains Mono', monospace;">${totals.carbs}g</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: rgba(10,14,26,0.6); font-weight: 600; margin-bottom: 0.25rem;">FATS</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--bg-dark); font-family: 'JetBrains Mono', monospace;">${totals.fat}g</div>
            </div>
        </div>
    `;
}

// Initialize schedule builder listeners
function initScheduleBuilder() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const typeSelect = document.getElementById(`${day}-type`);
        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                const isRest = this.value === 'rest';
                const details = document.getElementById(`${day}-details`);
                const intensityGroup = document.getElementById(`${day}-intensity-group`);
                const descriptionGroup = document.getElementById(`${day}-description-group`);
                
                if (details) details.style.display = isRest ? 'none' : 'block';
                if (intensityGroup) intensityGroup.style.display = isRest ? 'none' : 'block';
                if (descriptionGroup) descriptionGroup.style.display = isRest ? 'none' : 'block';
            });
        }
    });
}

// Call this when page loads
document.addEventListener('DOMContentLoaded', () => {
    initScheduleBuilder();
    
    // If user has a meal plan, update home page
    if (currentUser?.data?.mealPlanGenerated) {
        updateHomePage();
    }
});
