/*
    ======================================
    Custom dashboard telemetry data filter
    ======================================
*/

// This filter is used to change telemetry data
// before it is displayed on the dashboard.
// For example, you may convert km/h to mph, kilograms to tons, etc.
// "data" object is an instance of the Ets2TelemetryData class
// defined in dashboard-core.ts (or see JSON response in the server's API).

Funbit.Ets.Telemetry.Dashboard.prototype.filter = function (data) {
    // If the game isn't connected, don't both calculating anything.
    if (!data.game.connected) {
        return data;
    }

    // Process DOM changes here now that we have data. We should only do this once.
    if (!g_processedDomChanges) {
        processDomChanges(data);
    }

    data.isEts2 = g_runningGame == 'ETS2';
    data.isAts = !data.isEts2;

    // Logic consistent between ETS2 and ATS
    data.truckSpeedRounded = Math.abs(data.truck.speed > 0
        ? Math.floor(data.truck.speed)
        : Math.round(data.truck.speed));
    data.truckSpeedMph = data.truck.speed * 0.621371;
    data.truckSpeedMphRounded = Math.abs(Math.floor(data.truckSpeedMph));
	
	var distanceUnits = g_skinConfig[g_configPrefix].distanceUnits;
	if (data.truck.cruiseControlOn && distanceUnits === 'mi') {
		data.truck.cruiseControlSpeed = Math.round(data.truck.cruiseControlSpeed * .621371);
	}
	
	if (data.truck.shifterType === "automatic" || data.truck.shifterType === "arcade") {
		data.gear = data.truck.displayedGear > 0 ? 'A' + data.truck.displayedGear : (data.truck.displayedGear < 0 ? 'R' + Math.abs(data.truck.displayedGear) : 'N');
	} else {
		data.gear = data.truck.displayedGear > 0 ? data.truck.displayedGear : (data.truck.displayedGear < 0 ? 'R' + Math.abs(data.truck.displayedGear) : 'N');
	}
	data.truck.fuel = data.truck.fuel.toFixed(1);
	data.truck.fuelEco = 0;
	data.truck.fuelWarningFactor = data.truck.fuelWarningFactor.toFixed(2);
	var mod1=0;
	var mod2=0;
	//var snd1 = document.getElementById("ParkingBrakeBeep");   
	//var snd2 = document.getElementById("LowFuelBeep");
	if(data.truck.engineOn) {
		if(data.truck.parkBrakeOn == true && data.truck.gameThrottle > 0.1) {
			if(mod2 == 0) {
				mod1 = 1;
				data.truck.BrakeInfo = g_translations.ParkingBreakOn;
				$(".modal").css("display", "block");
				$(".modal2").css("display", "none");
				$('[data-tra="Info"]').text(g_translations.Warn);
				//snd1.play();
			}
		}
		else {
			mod1 = 0;
			data.truck.BrakeInfo = "";
			$(".modal").css("display", "none");
			$('[data-tra="Info"]').text(g_translations.Info);
			//snd1.pause();
			//snd1.currentTime = 0;
		}
		if((Math.round(data.truck.fuel) == data.truck.fuelCapacity*data.truck.fuelWarningFactor) || (Math.round(data.truck.fuel) == ((data.truck.fuelCapacity*data.truck.fuelWarningFactor)/2))) {
			if(mod1 == 0)
			{
				mod2 = 1;
				data.truck.FuelInfo = g_translations.FuelLow;
				data.truck.FuelInfo2 = g_translations.FuelLow2;
				$(".modal2").css("display", "block");
				$(".modal").css("display", "none");	 	
				//snd2.play();
			}
		}
		else {
			mod2 = 0;
			data.truck.FuelInfo = "";
			data.truck.FuelInfo2 = "";
			$(".modal2").css("display", "none");
			//snd2.pause();
			//snd2.currentTime = 0;
		}
	}
	data.truck.w1 = Math.floor(data.truck.wearEngine * 100) + '%';
    data.truck.w2 = Math.floor(data.truck.wearTransmission * 100) + '%';
    data.truck.w3 = Math.floor(data.truck.wearChassis * 100) + '%';
    data.truck.w4 = Math.floor(data.truck.wearCabin * 100) + '%';
    data.truck.w5 = Math.floor(data.truck.wearWheels * 100) + '%';
	
	data.truck.fuelAverageConsumption = data.truck.fuelAverageConsumption.toFixed(3);
    data.currentFuelPercentage = (data.truck.fuel / data.truck.fuelCapacity) * 100;
	data.truck.odometer = data.truck.odometer.toFixed(1) + ' km';
    data.scsTruckDamage = getDamagePercentage(data);
    data.scsTruckDamageRounded = Math.floor(data.scsTruckDamage) + ' %';
    data.wearTrailerRounded = Math.floor(data.trailer.wear * 100) + ' %';
    data.gameTime12h = getTime(data.game.time, 12);
    var originalTime = data.game.time;
    data.game.time = getTime(data.game.time, 24);
    var tons = (data.trailer.mass / 1000.0).toFixed(2);
    if (tons.substr(tons.length - 2) === "00") {
        tons = parseInt(tons);
    }
    data.trailerMassTons = data.trailer.attached ? (tons + ' t') : '';
    data.trailerMassKg = data.trailer.attached ? data.trailer.mass + ' kg' : '';
    data.trailerMassLbs = data.trailer.attached ? Math.round(data.trailer.mass * 2.20462) + ' lb' : '';
    data.game.nextRestStopTimeArray = getDaysHoursMinutesAndSeconds(data.game.nextRestStopTime);
    data.game.nextRestStopTime = processTimeDifferenceArray(data.game.nextRestStopTimeArray);
    data.navigation.speedLimitMph = data.navigation.speedLimit * .621371;
    data.navigation.speedLimitMphRounded = Math.round(data.navigation.speedLimitMph);
    data.navigation.estimatedDistanceKm = ((data.navigation.estimatedDistance / 1000).toFixed(1)) + ' km';
	if (data.trailer.attached || data.navigation.estimatedDistance == 0) {
		data.navigation.estimatedDistanceKmGPS = '<br />';	
		$('[data-tra="GPS"]').text("");		
	}
	else
	{
		data.navigation.estimatedDistanceKmGPS = data.navigation.estimatedDistanceKm;
		$('[data-tra="GPS"]').text(g_translations.GPS);
	}
    data.navigation.estimatedDistanceMi = ((data.navigation.estimatedDistanceKm * .621371).toFixed(1)) + ' mi';
    data.navigation.estimatedDistanceKmRounded = Math.floor(data.navigation.estimatedDistanceKm);
    data.navigation.estimatedDistanceMiRounded = Math.floor(data.navigation.estimatedDistanceMi);
    var timeToDestinationArray = getDaysHoursMinutesAndSeconds(data.navigation.estimatedTime);
    data.navigation.estimatedTime = addTime(originalTime,
                                            timeToDestinationArray[0],
                                            timeToDestinationArray[1],
                                            timeToDestinationArray[2],
                                            timeToDestinationArray[3]).toISOString();
    var estimatedTime24h = data.navigation.estimatedTime
    data.navigation.estimatedTime = getTime(data.navigation.estimatedTime, 24);
    data.navigation.estimatedTime12h = getTime(estimatedTime24h, 12);
    data.navigation.timeToDestination = processTimeDifferenceArray(timeToDestinationArray);

    // ETS2-specific logic
    data.isWorldOfTrucksContract = isWorldOfTrucksContract(data);

    data.job.remainingTimeArray = getDaysHoursMinutesAndSeconds(data.job.remainingTime);
    data.job.remainingTime = processTimeDifferenceArray(data.job.remainingTimeArray);

    if (data.isEts2) {
        data.jobIncome = getEts2JobIncome(data.job.income);
    }

    // ATS-specific logic
    if (data.isAts) data.jobIncome = getAtsJobIncome(data.job.income);


    // Non-WoT stuff here
    if (!data.isWorldOfTrucksContract || data.isAts) {
        data.jobDeadlineTime12h = getTime(data.job.deadlineTime, 12);
        data.job.deadlineTime = getTime(data.job.deadlineTime, 24);
    }
	// Cities
	var i;
	var CountryCode;
	if (data.isEts2) {
		for(i=0; i<city.length; i++) {
			if(dist(data.truck.placement.x, data.truck.placement.z, city[i][0], city[i][1]) < 750 ){
				data.navigation.currentCity = city[i][2];
				CountryCode = city[i][3];
				document.getElementById("CCimg").src = g_pathPrefix + '/flags/' + CountryCode + '.png';
				document.getElementById("CCimgC1").src = g_pathPrefix + '/flags/' + CountryCode + '.png';
				document.getElementById("CCimgC2").src = g_pathPrefix + '/flags/' + CountryCode + '.png';
				document.getElementById("CCimgT1").src = g_pathPrefix + '/flags/' + CountryCode + '.png';
				document.getElementById("CCimgT2").src = g_pathPrefix + '/flags/' + CountryCode + '.png';
				document.getElementById("CCimgRI").src = g_pathPrefix + '/flags/' + CountryCode + '.png';
				break;
			}
			else {
				data.navigation.currentCity = "";
				document.getElementById("CCimg").src = g_pathPrefix + '/flags/empti.png';
				document.getElementById("CCimgC1").src = g_pathPrefix + '/flags/empti.png';
				document.getElementById("CCimgC2").src = g_pathPrefix + '/flags/empti.png';
				document.getElementById("CCimgT1").src = g_pathPrefix + '/flags/empti.png';
				document.getElementById("CCimgT2").src = g_pathPrefix + '/flags/empti.png';
				document.getElementById("CCimgRI").src = g_pathPrefix + '/flags/empti.png';
			}
		}
	}
	else {
		data.navigation.currentCity = "";
		document.getElementById("CCimg").src = g_pathPrefix + '/flags/empti.png';
		document.getElementById("CCimgC1").src = g_pathPrefix + '/flags/empti.png';
		document.getElementById("CCimgC2").src = g_pathPrefix + '/flags/empti.png';
		document.getElementById("CCimgT1").src = g_pathPrefix + '/flags/empti.png';
		document.getElementById("CCimgT2").src = g_pathPrefix + '/flags/empti.png';
		document.getElementById("CCimgRI").src = g_pathPrefix + '/flags/empti.png';
	}
	
    // return changed data to the core for rendering
	
    return data;
};

Funbit.Ets.Telemetry.Dashboard.prototype.render = function (data) {
    // If the game isn't connected, don't both calculating anything.
    if (!data.game.connected) {
        return data;
    }

    if (data.game.gameName != null) {
        g_lastRunningGame = g_runningGame;
        g_runningGame = data.game.gameName;

        if (g_runningGame != g_lastRunningGame
            && g_lastRunningGame !== undefined) {
            setLocalStorageItem('currentTab', $('._tabs').find('article:visible:first').attr('id'));
            location.reload();
        }
    }

    /*// data - same data object as in the filter function
    $('.fillingIcon.truckDamage .top').css('height', (100 - data.scsTruckDamage) + '%');
    $('.fillingIcon.trailerDamage .top').css('height', (100 - data.trailer.wear * 100) + '%');
    $('.fillingIcon.fuel .top').css('height', (100 - data.currentFuelPercentage) + '%');
    $('.fillingIcon.rest .top').css('height', (100 - getFatiguePercentage(data.game.nextRestStopTimeArray[1], data.game.nextRestStopTimeArray[2])) + '%');*/

    // Process DOM for connection
    if (data.game.connected) {
        $('#_overlay').hide();
    } else {
        $('#_overlay').show();
    }
	
	/*if (data.truck.cruiseControlOn) {
		$('.cruiseControl').show();
		$('.noCruiseControl').hide();
		$('._speed').css('color', 'lime');
	} else {
		$('.cruiseControl').hide();
		$('.noCruiseControl').show();
		$('._speed').css('color', 'white');
	}*/

    // Process DOM for job
    if (data.trailer.attached) {
        $('.hasJob').show();
        $('.noJob').hide();
    } else {
        $('.hasJob').hide();
        $('.noJob').show();
    }

    // If speed limit is "0", hide the speed limit display
    if (data.navigation.speedLimit == 0) {
        $('div.road-sign').css('display', 'none');
		$('p.speed-limit').css('display', 'none');
    } else {
        $('div.road-sign').css('display', 'block');
		$('p.speed-limit').css('display', 'block');
    }

    // Set skin to World of Trucks mode if this is a World of Trucks contract
    if (data.isWorldOfTrucksContract) {
        $('[data-tra="Remains"]').text(g_translations.WorldOfTrucksContract);     
        $('[data-tra="Remains"]').css('color', '#0CAFF0');
		$('p.checkWoT').css('visibility', 'hidden');

    } else {
        $('[data-tra="Remains"]').text(g_translations.Remains);
        $('[data-tra="Remains"]').css('color', '#fff');
		$('p.checkWoT').css('visibility', 'visible');
    }

    // Set the current game attribute for any properties that are game-specific
    $('.game-specific').attr('data-game-name', data.game.gameName);

    // Update red bar if speeding
    //updateSpeedIndicator(data.navigation.speedLimit, data.truck.speed);
	
    return data;
}

Funbit.Ets.Telemetry.Dashboard.prototype.initialize = function (skinConfig) {
    //
    // skinConfig - a copy of the skin configuration from config.json
    //
    // this function is called before everything else,
    // so you may perform any DOM or resource initializations here

    g_skinConfig = skinConfig;
    g_pathPrefix = 'skins/' + g_skinConfig.name;

    // Process language JSON
    $.getJSON(g_pathPrefix + '/language/' + g_skinConfig.language, function(json) {
        g_translations = json;
        $.each(json, function(key, value) {
            updateLanguage(key, value);
        });
    });

    // Set the version number on the about page
    /*versionText = $('#version').text();
    $('#version').text(versionText + g_currentVersion);*/

    var tabToShow = getLocalStorageItem('currentTab', '_truck');
    if (tabToShow == null) {
        tabToShow = '_truck';
    }
    removeLocalStorageItem('currentTab');
    showTab(tabToShow);
}

function getDaysHoursMinutesAndSeconds(time) {
    var dateTime = new Date(time);
    var days = dateTime.getUTCDay();
    var hour = dateTime.getUTCHours();
    var minute = dateTime.getUTCMinutes();
    var second = dateTime.getUTCSeconds();
    return [days, hour, minute, second];
}

function addTime(time, days, hours, minutes, seconds) {
    var dateTime = new Date(time);

    return dateTime.addDays(days)
        .addHours(hours)
        .addMinutes(minutes)
        .addSeconds(seconds);
}

function getFatiguePercentage(hoursUntilRest, minutesUntilRest) {
    var FULLY_RESTED_TIME_REMAINING_IN_MILLISECONDS = 11*60*60*1000; // 11 hours * 60 min * 60 sec * 1000 milliseconds

    if (hoursUntilRest <= 0 && minutesUntilRest <= 0) {
        return 100;
    }

    var hoursInMilliseconds = hoursUntilRest * 60 * 60 * 1000; // # hours * 60 min * 60 sec * 1000 milliseconds
    var minutesInMilliseconds = minutesUntilRest * 60 * 1000; // # minutes * 60 sec * 1000 milliseconds

    return 100 - (((hoursInMilliseconds + minutesInMilliseconds) / FULLY_RESTED_TIME_REMAINING_IN_MILLISECONDS) * 100);
}

function processTimeDifferenceArray(hourMinuteArray) {
    var day = hourMinuteArray[0];
    var hours = hourMinuteArray[1];
    var minutes = hourMinuteArray[2];

    hours += (day - 1) * 24;

    if (hours <= 0 && minutes <= 0) {
        minutes = g_translations.XMinutes.replace('{0}', 0);
        return minutes;
    }

    if (hours == 1) {
        hours = g_translations.XHour.replace('{0}', hours);
    } else if (hours == 0) {
        hours = '';
    } else {
        hours = g_translations.XHours.replace('{0}', hours);
    }

    if (minutes == 1) {
        minutes = g_translations.XMinute.replace('{0}', minutes);
    } else {
        minutes = g_translations.XMinutes.replace('{0}', minutes);
    }
    return hours + ' ' + minutes;
}

function getTime(gameTime, timeUnits) {
    var currentTime = new Date(gameTime);
    var currentPeriod = timeUnits === 12 ? ' AM' : '';
    var currentHours = currentTime.getUTCHours();
    var currentMinutes = currentTime.getUTCMinutes();
    var formattedMinutes = currentMinutes < 10 ? '0' + currentMinutes : currentMinutes;
    var currentDay = '';


    switch (currentTime.getUTCDay()) {
        case 0:
            currentDay = g_translations.SundayAbbreviated;
            break;
        case 1:
            currentDay = g_translations.MondayAbbreviated;
            break;
        case 2:
            currentDay = g_translations.TuesdayAbbreviated;
            break;
        case 3:
            currentDay = g_translations.WednesdayAbbreviated;
            break;
        case 4:
            currentDay = g_translations.ThursdayAbbreviated;
            break;
        case 5:
            currentDay = g_translations.FridayAbbreviated;
            break;
        case 6:
            currentDay = g_translations.SaturdayAbbreviated;
            break;
    }

    if (currentHours > 12 && timeUnits === 12) {
        currentHours -= 12;
        currentPeriod = ' PM';
    }
    if (currentHours == 0) {
        currentHours = 12;
    }
    var formattedHours = currentHours < 10 && timeUnits === 24 ? '0' + currentHours : currentHours;

    return currentDay + ' ' + formattedHours + ':' + formattedMinutes + currentPeriod;
}

function updateLanguage(key, value) {
    $('[data-tra="' + key + '"]').text(value);
}

function getEts2JobIncome(income) {
    var currencyCode = g_skinConfig[g_configPrefix].currencyCode;
    var currencyCodes = [];
    currencyCodes['EUR'] = buildCurrencyCode(1, '', '&euro;', '');
    currencyCodes['GBP'] = buildCurrencyCode(0.8, '', '&pound;', '');
    currencyCodes['CHF'] = buildCurrencyCode(1.2, '', '', ' CHF');
    currencyCodes['CZK'] = buildCurrencyCode(25, '', '', ' K&#x10D;');
    currencyCodes['PLN'] = buildCurrencyCode(4.2, '', '', ' z&#0322;');
    currencyCodes['HUF'] = buildCurrencyCode(293, '', '', ' Ft');
    currencyCodes['DKK'] = buildCurrencyCode(7.5, '', '', ' kr');
    currencyCodes['SEK'] = buildCurrencyCode(9.4, '', '', ' kr');
    currencyCodes['NOK'] = buildCurrencyCode(8.6, '', '', ' kr');

    var code = currencyCodes[currencyCode];

    if (code === undefined) {
        var errorText = "Configuration Issue: The currency code '" + currencyCode + "' is invalid. Reverted to 'EUR'.";
        code = currencyCodes['EUR'];
        console.error(errorText);
    }

    return formatIncome(income, code);
}

function buildCurrencyCode(multiplier, symbolOne, symbolTwo, symbolThree) {
    return {
        "multiplier": multiplier,
        "symbolOne": symbolOne,
        "symbolTwo": symbolTwo,
        "symbolThree": symbolThree
    };
}

function formatIncome(income, currencyCode) {
    /* Taken directly from economy_data.sii:
          - {0} First prefix (no currency codes currently use this)
          - {1} Second prefix (such as euro, pound, dollar, etc)
          - {2} The actual income, already converted into the proper currency
          - {3} Third prefix (such as CHF, Ft, or kr)
    */
    var incomeFormat = "{0}{1} {2}.- {3}";
    income *= currencyCode.multiplier;

    return incomeFormat.replace('{0}', currencyCode.symbolOne)
        .replace('{1}', currencyCode.symbolTwo)
        .replace('{2}', income)
        .replace('{3}', currencyCode.symbolThree);
}

function getAtsJobIncome(income) {
    var currencyCode = g_skinConfig[g_configPrefix].currencyCode;
    var currencyCodes = [];
    currencyCodes['USD'] = buildCurrencyCode(1, '', '&#36;', '');
    currencyCodes['EUR'] = buildCurrencyCode(.75, '', '&euro;', '');

    var code = currencyCodes[currencyCode];

    if (code === undefined) {
        var errorText = "Configuration Issue: The currency code '" + currencyCode + "' is invalid. Reverted to 'USD'.";
        code = currencyCodes['USD'];
        console.error(errorText);
    }

    return formatIncome(income, code);
}

function getDamagePercentage(data) {
    // Return the max value of all damage percentages.
    return Math.max(data.truck.wearEngine,
                    data.truck.wearTransmission,
                    data.truck.wearCabin,
                    data.truck.wearChassis,
                    data.truck.wearWheels) * 100;
}

function showTab(tabName) {
    $('._active_tab').removeClass('_active_tab');
    $('#' + tabName).addClass('_active_tab');

    $('._active_tab_button').removeClass('_active_tab_button');
    $('#' + tabName + '_button').addClass('_active_tab_button');
	if(tabName = '_roadinfo') {
		isRoadInfoTab = true;
		getTraffic();
	}
	else isRoadInfoTab = false;
}

/** Returns the difference between two dates in ISO 8601 format in an [hour, minutes] array */
function getTimeDifference(begin, end) {
    var beginDate = new Date(begin);
    var endDate = new Date(end);
    var MILLISECONDS_IN_MINUTE = 60*1000;
    var MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE*60;
    var MILLISECONDS_IN_DAY = MILLISECONDS_IN_HOUR*24;

    var hours = Math.floor((endDate - beginDate) % MILLISECONDS_IN_DAY / MILLISECONDS_IN_HOUR) // number of hours
    var minutes = Math.floor((endDate - beginDate) % MILLISECONDS_IN_DAY % MILLISECONDS_IN_HOUR / MILLISECONDS_IN_MINUTE) // number of minutes
    return [hours, minutes];
}

function isWorldOfTrucksContract(data) {
    var WORLD_OF_TRUCKS_DEADLINE_TIME = "0001-01-01T00:00:00Z";
    var WORLD_OF_TRUCKS_REMAINING_TIME = "0001-01-01T00:00:00Z";

    return data.job.deadlineTime === WORLD_OF_TRUCKS_DEADLINE_TIME
        && data.job.remainingTime === WORLD_OF_TRUCKS_REMAINING_TIME;
}

// Wrapper function to set an item to local storage.
function setLocalStorageItem(key, value) {
    if (typeof(Storage) !== "undefined" && localStorage != null) {
        localStorage.setItem(key, value);
    }
}

// Wrapper function to get an item from local storage, or default if local storage is not supported.
function getLocalStorageItem(key, defaultValue) {
    if (typeof(Storage) !== "undefined" && localStorage != null) {
        return localStorage.getItem(key);
    }

    return defaultValue;
}

// Wrapper function to remove an item from local storage
function removeLocalStorageItem(key) {
    if (typeof(Storage) !== "undefined" && localStorage != null) {
        return localStorage.removeItem(key);
    }
}

function processDomChanges(data) {
    g_configPrefix = 'ets2';
    if (data.game.gameName != null) {
        g_configPrefix = data.game.gameName.toLowerCase();
    }

    // Process Speed Units
    var distanceUnits = g_skinConfig[g_configPrefix].distanceUnits;
    if (distanceUnits === 'km') {
        $('.speedUnits').text('km/h');
        $('.distanceUnits').text('km');
        $('.truckSpeedRoundedKmhMph').addClass('truckSpeedRounded').removeClass('truckSpeedRoundedKmhMph');
        $('.speedLimitRoundedKmhMph').addClass('navigation-speedLimit').removeClass('speedLimitRoundedKmhMph');
        $('.navigationEstimatedDistanceKmMi').addClass('navigation-estimatedDistanceKmRounded').removeClass('navigationEstimatedDistanceKmMi');
    } else if (distanceUnits === 'mi') {
        $('.speedUnits').text('mph');
        $('.distanceUnits').text('mi');
        $('.truckSpeedRoundedKmhMph').addClass('truckSpeedMphRounded').removeClass('truckSpeedRoundedKmhMph');
        $('.speedLimitRoundedKmhMph').addClass('navigation-speedLimitMphRounded').removeClass('speedLimitRoundedKmhMph');
        $('.navigationEstimatedDistanceKmMi').addClass('navigation-estimatedDistanceMiRounded').removeClass('navigationEstimatedDistanceKmMi');
    }

    // Process kg vs tons
    var weightUnits = g_skinConfig[g_configPrefix].weightUnits;
    if (weightUnits === 'kg') {
        $('.trailerMassKgOrT').addClass('trailerMassKg').removeClass('trailerMassKgOrT');
    } else if (weightUnits === 't') {
        $('.trailerMassKgOrT').addClass('trailerMassTons').removeClass('trailerMassKgOrT');
    } else if (weightUnits === 'lb') {
        $('.trailerMassKgOrT').addClass('trailerMassLbs').removeClass('trailerMassKgOrT');
    }

    // Process 12 vs 24 hr time
    var timeFormat = g_skinConfig[g_configPrefix].timeFormat;
    if (timeFormat === '12h') {
        $('.game-time').addClass('gameTime12h').removeClass('game-time');
        $('.job-deadlineTime').addClass('jobDeadlineTime12h').removeClass('job-deadlineTime');
        $('.navigation-estimatedTime').addClass('navigation-estimatedTime12h').removeClass('navigation-estimatedTime');
    }
	
	//Process tab for MP
	var truckMP = g_skinConfig.isMultiplayer;
	if(data.isEts2) {
		if(truckMP == true) {
			$("div.MP").css("display", "inline");
		}
		else if(truckMP == false) {
			$("div.MP").css("display", "none");
		}
	}
	else {
		$("div.MP").css("display", "none");
	}
    g_processedDomChanges = true;
}

/*function updateSpeedIndicator(speedLimit, currentSpeed) {
    /*
     The game starts the red indication at 1 km/h over, and stays a solid red at 8 km/h over (...I think).
    
    var MAX_SPEED_FOR_FULL_RED = 8;
    var difference = parseInt(currentSpeed) - speedLimit;
    var opacity = 0;

    if (difference > 0 && speedLimit != 0) {
        var opacity = difference / MAX_SPEED_FOR_FULL_RED;
    }

    var style = 'linear-gradient(to bottom, rgba(127,0,0,{0}) 0%, rgba(255,0,0,{0}) 50%, rgba(127,0,0,{0}) 100%)';
    style = style.split('{0}').join(opacity);
    $('.dashboard').find('aside').find('div._speed').css('background', style);
}*/

function diff (num1, num2) {
  if (num1 > num2) {
    return (num1 - num2);
  } else {
    return (num2 - num1);
  }
};

function dist (x1, y1, x2, y2) {
  var deltaX = diff(x1, x2);
  var deltaY = diff(y1, y2);
  var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  return (dist);
};

function diagnostic()
{
	$(".modal3").css("display", "block");
	$(".modal-body").css("display", "block");
	$(".modal-bodychange").css("display", "none");
	var tajmer;
	tajmer = setTimeout(wearCheck, 1500);	
}

function wearCheck()
{
	$(".modal-body").css("display", "none");
	$(".modal-bodychange").css("display", "block");
}

function closeDiagnostics()
{
	$(".modal-body").css("display", "block");
	$(".modal3").css("display", "none");
}

function getTraffic()
{
	var i = 0;
	fetch( 'https://api.truckyapp.com/v2/traffic/top?server=eu2&game=ets2', { 
		method: 'get'
	}).then((resp) => resp.json()).then( function(traffic) {
		console.log("success");
	for(i=0;i<traffic.response.length;i++) {
		var strType = traffic.response[i].name;
		var sevType = traffic.response[i].severity;
		if(strType.endsWith("(City)")) {
			strType = strType.replace("City", g_translations.CityT);
		}
		else if(strType.endsWith("(Intersection)")) {
			strType = strType.replace("Intersection", g_translations.IntersectionT);
		}
		else if(strType.endsWith("(Road)")) {
			strType = strType.replace("Road", g_translations.RoadT);
		}
		if(sevType.localeCompare("Heavy") == 0) {
			sevType = sevType.replace("Heavy", g_translations.HeavyT);
			sevType = sevType.fontcolor("#ff0000");
		}
		else if(sevType.localeCompare("Low") == 0) {
			sevType = sevType.replace("Low", g_translations.LowT); 
			sevType = sevType.fontcolor("#84ca50");
		}
		else if(sevType.localeCompare("Moderate") == 0) {
			sevType = sevType.replace("Moderate", g_translations.ModerateT);
			sevType = sevType.fontcolor("#fb9912");
		}
		else if(sevType.localeCompare("Congested") == 0) {
			sevType = sevType.replace("Congested", g_translations.CongestedT);
			sevType = sevType.fontcolor("#b71515");
		}
		document.getElementById("traffic"+i).innerHTML = strType;
		document.getElementById("ptraffic"+i).innerHTML = sevType + " (" + traffic.response[i].players + ")";
		//document.getElementById("ptraffic"+i).style.color = traffic.response[i].color;
	}
	}).catch( function(err) {
		console.log("fail");
	});
}

Date.prototype.addDays = function(d) {
    this.setUTCDate(this.getUTCDate() + d - 1);
    return this;
}

Date.prototype.addHours = function(h) {
   this.setTime(this.getTime() + (h*60*60*1000));
   return this;
}

Date.prototype.addMinutes = function(m) {
    this.setTime(this.getTime() + (m*60*1000));
    return this;
}

Date.prototype.addSeconds = function(s) {
    this.setTime(this.getTime() + (s*1000));
    return this;
}


// Global vars

// Gets updated to the actual path in initialize function.
var g_pathPrefix;

// Loaded with the JSON object for the choosen language.
var g_translations;

// A copy of the skinConfig object.
var g_skinConfig;

// The current version of Route Advisor
//var g_currentVersion = '1.0.0';

// The currently running game
var g_runningGame;

// The prefix for game-specific settings (either "ets2" or "ats")
var g_configPrefix;

// The running game the last time we checked
var g_lastRunningGame;

// Checked if we have processed the DOM changes already.
var g_processedDomChanges;

//city list
var city = [
[855.258, -35995.1, "Aalborg", "den"],
[-38846.7, -55270.3, "Aberdeen", "uk"],
[-25953.6, 28986.3, "Saint-Alban-du-Rhône", "fra"],
[-18562, -11736.2, "Amsterdam", "net"],
[10481.3, 39958.3, "Ancona", "ita"],
[24031.2, 54351.4, "Bari", "ita"],
[-10371.6, -55777.6, "Bergen", "nor"],
[10183.1, -10001.2, "Berlin", "ger"],
[-12730.8, 20130.1, "Bern", "swi"],
[44098.4, -15083.4, "Białystok", "pol"],
[-45951.1, -20423, "Birmingham", "uk"],
[1120.11, 33802.9, "Bologna", "ita"],
[-46138.6, 27274.4, "Bordeaux", "fra"],
[-31951.8, 16275.5, "Bourges", "fra"],
[24823.3, 14831, "Bratislava", "slo"],
[-4545.41, -14326.1, "Bremen", "ger"],
[-56771.4, 3869.3, "Brest", "fra"],
[22273.8, 8964.95, "Brno", "cze"],
[-21576, -3235.03, "Brussel", "bel"],
[32367.8, 17882.7, "Budapest", "hun"],
[32657.6, 10680.5, "Banská Bystrica", "slo"],
[-30363, -4985.64, "Calais", "fra"],
[-36822.7, -16119.4, "Cambrige", "uk"],
[-54005.3, -14698.4, "Cardiff", "uk"],
[-45889.2, -39573.5, "Carlisle", "uk"],
[12294, 52235, "Cassino", "ita"],
[16470.8, 75052.5, "Catania", "ita"],
[23791.8, 66945.9, "Catanzaro", "ita"],
[-39029.7, 18292, "Civaux", "fra"],
[-30447.4, 24698.4, "Clermont-Ferrand", "fra"],
[41641.6, 17483.7, "Debrecen", "hun"],
[-22470, 16655.5, "Dijon", "fra"],
[-8266.59, -4718.39, "Dortmund", "ger"],
[-33321.9, -7884.36, "Dover", "uk"],
[12411.8, -1606.27, "Dresden", "ger"],
[-13113.6, -6370.93, "Duisberg", "ger"],
[-13377.2, -4399.6, "Düsseldorf", "ger"],
[-44900.7, -47219.7, "Edinburgh", "uk"], 
[2436.19, -1733.77, "Erfurt", "ger"],
[-4699.43, -27555.9, "Esbjerg", "den"],
[-31664.6, -13837.2, "Felixstowe", "uk"],
[1081.75, 38862.9, "Firenze", "ita"],
[-6304.08, 2732.91, "Frankfurt am Main", "ger"],
[2711.7, -38141.5, "Frederikshavn", "den"],
[28343.1, -20619.5, "Gdańsk", "pol"],
[6271.11, -22000.3, "Gedser", "den"],
[-18099.1, 23717, "Genève", "swi"],
[-8032.25, 35396.1, "Genova", "ita"],
[-50384.7, -48471.6, "Glasgow", "uk"],
[-40395.4, 31472.6, "Golfech", "fra"],
[7235.89, -40227.5, "Göteborg", "swe"],
[18216.5, 20552.7, "Graz", "aus"],
[-36117.9, -26575.2, "Grimsby", "uk"],
[-12437.6, -15468.7, "Groningen", "net"],
[-1666.25, -16912.1, "Hamburg", "ger"],
[-1928.93, -8916.4, "Hannover", "ger"],
[9405.2, -29882.4, "Helsingborg", "swe"],
[1425.47, -38873.3, "Hirtshals", "den"],
[2250.90, 19214.4, "Innsbruck", "aus"],
[14177.3, -39576.6, "Jönköping", "swe"],
[20559.5, -33634.5, "Kalmar", "swe"],
[17145.6, -30862.4, "Karlskrona", "swe"],
[-3031.32, -3898.7, "Kassel", "ger"],
[30728.8, 2458.83, "Katowice", "pol"],
[188.074, -20826.7, "Kiel", "ger"],
[13841.3, 23052.6, "Klagenfurt am Wörthersee", "aus"],
[8100.74, -28097.8, "København", "den"],
[-13150.8, -2732.75, "Köln", "ger"],
[39843.9, 10494.4, "Košice", "slo"],
[34470.3, 3249.68, "Kraków", "pol"],
[-4638.28, -42891.5, "Kristiansand", "nor"],
[-46575.7, 19532.5, "La Rochelle", "fra"],
[-35649.6, 13817.4, "Saint-Laurent", "fra"],
[-37894.2, 1515.48, "Le Havre", "fra"],
[7042.06, -3160.18, "Leipzig", "ger"],
[-39749.7, 9718.43, "Le Mans", "fra"],
[-17181.5, -1231.25, "Liège", "bel"],
[-26495.9, -2483.4, "Lille", "fra"],
[-37417.3, 23632, "Limoges", "fra"],
[18411.7, -43092.9, "Linköping", "swe"],
[13665.7, 13754.6, "Linz", "aus"],
[-48871.7, -29091.8, "Liverpool", "uk"],
[-2468.3, 40201.8, "Livorno", "ita"],
[32014.5, -6143.92, "Łódź", "pol"],
[-39546.9, -11564.2, "London", "uk"],
[43244.2, -4104.96, "Lublin", "pol"],
[-16134.2, 4382.97, "Luxembourg", "lux"],
[-23869.8, 25892.3, "Lyon", "fra"],
[4601.58, -7896.8, "Magdeburg", "ger"],
[10744.9, -27481.2, "Malmö", "swe"],
[-45548.7, -27815, "Manchester", "uk"],
[-7722.87, 6165.95, "Mannheim", "ger"],
[-23472.4, 39210.8, "Marseille", "fra"],
[18375.9, 70984.3, "Messina", "ita"],
[-16294.5, 7463.71, "Metz", "fra"],
[-6816.45, 29438.7, "Milano", "ita"],
[-30052.4, 36127.6, "Montpellier", "fra"],
[3234.12, 14470, "München", "ger"],
[-47170.9, 13162, "Nantes", "fra"],
[13318.2, 56090.3, "Napoli", "ita"],
[-39778, -38787.7, "Newcastle-upon-Tyne", "uk"],
[-15520.4, 38206.2, "Nice", "fra"],
[2665.54, 7237.8, "Nürnberg", "ger"],
[25032, -46079.8, "Nynäshamn", "swe"],
[1617.69, -26700.4, "Odense", "den"],
[34758.6, -17885.9, "Olsztyn", "pol"],
[17087.8, -48374.7, "Örebro", "swe"],
[4390.91, -53410.5, "Oslo", "nor"],
[-7702.9, -9613.47, "Osnabrück", "ger"],
[28231.9, 5136.1, "Ostrava", "cze"],
[8976.02, 71132.3, "Palermo", "ita"],
[-33608.1, 224.902, "Paluel", "fra"],
[-30427.3, 6886.2, "Paris", "fra"],
[-2906.44, 33954.3, "Parma", "ita"],
[29039.9, 26311.6, "Pécs", "hun"],
[12898.1, 46848.1, "Pescara", "ita"],
[-60041.4, -7882.32, "Plymouth", "uk"],
[22863.4, -9112.2, "Poznań", "pol"],
[14299.7, 3978.97, "Praha", "cze"],
[-24054.8, 5680.14, "Reims", "fra"],
[-46539.8, 8064.61, "Rennes", "fra"],
[6261.25, 49499.3, "Roma", "ita"],
[-53697.9, 3120.41, "Roscoff", "fra"],
[6490.95, -18588.9, "Rostock", "ger"],
[-20006, -8985.8, "Rotterdam", "net"],
[9075.84, 16564.5, "Salzburg", "aus"],
[19265.8, 70689.2, "Villa San Giovanni", "ita"],
[-42688.8, -26687.6, "Sheffield", "uk"],
[23525.2, -46319.9, "Södertälje", "swe"],
[-46338.7, -7523.25, "Southampton", "uk"],
[-10553.7, -48126.8, "Stavanger", "nor"],
[24743.6, -47746.1, "Stockholm", "swe"],
[-10786.9, 11198.7, "Strasbourg", "fra"],
[-4957.84, 10047, "Stuttgart", "ger"],
[-780.824, 32296.8, "Suzzara", "ita"],
[-56896, -16881.9, "Swansea", "uk"],
[15052.7, -15049.8, "Szczecin", "pol"],
[36880.7, 24565.7, "Szeged", "hun"],
[25990.6, 58091.4, "Taranto", "ita"],
[6716.62, 46211.8, "Terni", "ita"],
[-12697.3, 30932, "Torino", "ita"],
[-39213.8, 35665.6, "Toulouse", "fra"],
[10808.3, -25887, "Trelleborg", "swe"],
[24021.5, -51634.5, "Uppsala", "swe"],
[20937.7, -50468.3, "Västerås", "swe"],
[16044.4, -34835.6, "Växjö", "swe"],
[5089.88, 30078.9, "Venezia", "ita"],
[39.1094, 29453.3, "Verona", "ita"],
[37444.9, -9435.84, "Warszawa", "pol"],
[21298.3, 14215.5, "Wien", "aus"],
[23502.9, -1950.98, "Wrocław", "pol"],
[-8473.81, 17968.5, "Zürich", "swi"]
];
