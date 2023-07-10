// Main Section 
function scrollSections_Scroll() {
    scrollSections.addEventListener('scroll', function(event) {
        var scrollPosition = scrollSections.scrollTop;
        // var sectionHeight = scrollSections.offsetHeight;
        mainAnim.enableBlending = true;
        mainAnim.blendingSpeed = 0.01;

        currentTime = scrollPosition / animationMultiplier;
        if (currentTime > 0.1 && currentTime < animationDuration-1)
        {
            mainAnim.start(false, 1, currentTime, currentTime, false);
        }
        checkPositionForDIVS();
    });
}


// Override Scroll Wheel //
function wheelScroll() {
    window.addEventListener("wheel", function(event) {
        event.preventDefault
        // console.log("event.deltaY " + event.deltaY);
        if (event.deltaY < -10) {
            // console.log("MouseWheel Up");
            prevStep();
        } else if (event.deltaY > 10) {
            // console.log("MouseWheel Down");
            nextStep();
        }
    });  
}

let touchstartY = 0;
let touchmoveY = 0;
let touchendY = 0;
var distance = 0;

function touchStart(e) {
    touchstartY = e.touches[0].clientY;
    distance = 0;
}


function touchMoved(e) {
    touchmoveY = e.touches[0].clientY;
    const distance = Math.abs(touchmoveY - touchstartY);
    if (distance > 5) {
        // e.preventDefault();
        if (e.cancelable) e.preventDefault();
    }
}


function touchEnd(e) {
    if (touchmoveY == 0)
    touchmoveY = touchstartY;

    touchendY = touchmoveY - touchstartY;
    distance = Math.abs(touchendY);

    // console.log("distance: " + distance);
    if (distance > 100) {
        if (touchendY > 0) {
            prevStep();
        } else {
            nextStep();
        }
    }

    touchstartY = 0;
    touchmoveY = 0;
    touchendY = 0;
    distance = 0;
}

// Override Touch for Swipe Detection //
function swipeScroll() {
    console.log("Swipe Listernet ADDED");
    scrollSections.addEventListener('touchstart', touchStart);
    scrollSections.addEventListener('touchmove', touchMoved);
    scrollSections.addEventListener('touchend', touchEnd);
}

function removeSwipeScroll() {
    console.log("Swipe Listernet REMOVED");
    scrollSections.removeEventListener('touchstart', touchStart);
    scrollSections.removeEventListener('touchmove', touchMoved);
    scrollSections.removeEventListener('touchend', touchEnd);
}

// Check Position for DIVS //
function checkPositionForDIVS() {

    // console.log("ScrollPosition " + scrollSections.scrollTop);
    for (let index = 0; index < scrollSteps.length; index++) {
        var sect = document.getElementById("section-" + index);

        if (scrollSections.scrollTop >= scrollSteps[index]-offset_in && scrollSections.scrollTop <= scrollSteps[index]+offset_out) {
            sect.classList.remove("hidden");
            currentStep = index;
        } else {
            if (index < scrollSteps.length-1)
            sect.classList.add("hidden");
        }
    }  

    if (isTouch)
    {
        // Check Listeners
        if (listenerAdded) {
            if (scrollSections.scrollTop >= scrollSteps.at(scrollSteps.length - 1))
            {
                listenerAdded = false;
                removeSwipeScroll();
            }
        }
        if (!listenerAdded) {
            if (scrollSections.scrollTop < scrollSteps.at(scrollSteps.length - 1))
            {
                listenerAdded = true;
                swipeScroll();
            }
        }
    }
}


// Button Steps //
function nextStep() { 
    if (currentStep < scrollSteps.length-1)
    {
        if (disableStepNavigation)
        return;

        setTimeout(() => {
            disableStepNavigation = false;
        }, disableStepNavigation_Delay);
        disableStepNavigation = true;

        currentStep++;
        console.log("CurrentStep " + currentStep);
        scrollToAnimated(scrollSections, scrollSteps[currentStep], scrollSpeed);
    }
}

function prevStep() {
    if (currentStep > 0)
    {
        if (disableStepNavigation)
        return;

        setTimeout(() => {
            disableStepNavigation = false;
        }, disableStepNavigation_Delay);
        disableStepNavigation = true;

        currentStep--;
        console.log("CurrentStep " + currentStep);
        scrollToAnimated(scrollSections, scrollSteps[currentStep], scrollSpeed);
    }
}

// Scroll To Animated
function scrollToAnimated(element, to, duration) {
    var start = element.scrollTop;
    var distance = Math.abs(to - start);
    var duration = distance / scrollSpeed * 1000; // duración de la animación en milisegundos
    var startTime = performance.now();
  
    function animateScroll() {
      var time = performance.now() - startTime;
      var percentage = Math.min(time / duration, 1);
  
      element.scrollTop = start + (to - start) * percentage;
  
      if (percentage < 1) {
        requestAnimationFrame(animateScroll);
      }
    }
    requestAnimationFrame(animateScroll);
}
  

function checkButtons() {
    var left_BT = document.getElementById("arrow-left");
    var right_BT = document.getElementById("arrow-right");
    if (!use_buttons) {
        left_BT.style.display = "none";
        right_BT.style.display = "none";
    }

    if (showScrollIcon) {
        var download_gif = document.getElementById("donwload-gif");
        setInterval(() => {
            if (currentStep <= 0)
            {
                left_BT.style.pointerEvents = "none";
                left_BT.style.opacity = 0.25;
            } else {
                left_BT.style.pointerEvents = "auto";
                left_BT.style.opacity = 1;
            }
    
            if (currentStep >= scrollSteps.length-1)
            {
                right_BT.style.pointerEvents = "none";
                right_BT.style.opacity = 0.25;
            } else {
                right_BT.style.pointerEvents = "auto";
                right_BT.style.opacity = 1;
            }
    
            if (currentStep > 0)
            {
                download_gif.classList.add("hidden");
            } else {
                download_gif.classList.remove("hidden");
            }

        }, 200);
    }

    if (showStats) {
        setInterval(() => {
            var currentPosText = document.getElementById("stats-text");
            currentPosText.innerHTML = "<b>Animation Time:</b> " + Math.round(currentTime) + " frames <br><b>Scroll Position:</b> " + Math.round(scrollSections.scrollTop) + " px<br><b>--- " + Math.round(engine.getFps()) + " FPS ---</b> ";
        }, 200);
    }
}

// Camera Mouse Movement //
var moveScale = 50;
function setMouseCameraMove() {
    if(!isTouch) 
    {
        var mouseMove = function(evt){
        evt.preventDefault();
            // reduce the scrolling speed
            let mX, mY
            if (evt.movementX != 0) {mX = evt.movementX / moveScale}
            else mX = evt.movementX
            if (evt.movementY != 0) {mY = evt.movementY / -moveScale}
            else mY = evt.movementY
            // Take delta of mouse movement from last event and create movement vector
            var movementVector = new BABYLON.Vector3(mX/moveScale, 0, mY/moveScale);
            window.scene.activeCamera.position.addInPlace(movementVector);
            // if (second < 6.4)
        }
        window.addEventListener('mousemove',mouseMove,false);
    } 
}

function scrollToStep(scrollIndex) {
    $('.navbar-collapse').collapse('hide');
    currentStep = scrollIndex;
    scrollToAnimated(scrollSections, scrollSteps[currentStep], scrollSpeed);
}