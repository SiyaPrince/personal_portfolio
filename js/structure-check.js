// Run this in browser console to see your actual file structure
console.log('📁 Current JS structure:');
const checkFiles = async () => {
    const files = [
        'js/main.js',
        'js/core/App.js',
        'js/core/EventManager.js', 
        'js/core/ErrorHandler.js',
        'js/components/Header.js',
        'js/components/Footer.js',
        'js/components/Router.js'
    ];
    
    for (const file of files) {
        try {
            const response = await fetch(file);
            console.log(response.ok ? `✅ ${file}` : `❌ ${file} - ${response.status}`);
        } catch (error) {
            console.log(`❌ ${file} - ${error.message}`);
        }
    }
};

checkFiles();