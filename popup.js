// JavaScript for popup logic
console.log("This file is being ran!");

//Logic for closing the pop-up
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("close-btn");

  closeBtn.addEventListener("click", () => {
    window.close();
  });
});
