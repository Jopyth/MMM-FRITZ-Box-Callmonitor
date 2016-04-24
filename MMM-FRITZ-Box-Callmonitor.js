/* global Module */

/* Magic Mirror
 * Module: MMM-FRITZ-Box-Callmonitor
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register("MMM-FRITZ-Box-Callmonitor",{
	
	// Default module config.
	defaults: {
		NumberFontSize: "30px",
		vCard: false,
		fritzIP: "192.168.178.1",
		fritzPort: 1012,
		maximumEntrieDistance: 60,
		maximumEntries: 5,
		fade: true,
		fadePoint: 0.25
		
	},
	
	// Define required translations.
	getTranslations: function() {
		return {
			en: "translations/en.json",
			de: "translations/de.json"
		};
	},
	
	getScripts: function() {
		return ["moment.js"];
	},
	
	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "call") {
			if (payload != "clear"){
				//Add call to call_history (timestamp and caller)
				this.call_history.push({"time": moment(), "caller": payload})
				//Show alert on UI
				this.sendNotification("SHOW_ALERT", {
					title: this.translate("title"),
					message: "<span style='font-size:" + this.config.NumberFontSize + "'>" + payload + "<span>",
					imageFA: "phone"
				});
			}
			if (payload == "clear"){
				//Remove alert from UI
				this.sendNotification("HIDE_ALERT");
				//Update call list on UI
				this.updateDom(3000);
			}
			
		}
	},
	
	start: function() {
		//Create call_history array
		this.call_history = []
		//Set helper variable this so it is available in the timer
		var self = this;
		//Update doom every minute so that the time of the call updates and calls get removed after a certain time
		setInterval(function() {
			self.updateDom();
		}, 60000);
		
		//Send config to the node helper
		this.sendSocketNotification("CONFIG", this.config);
		Log.info("Starting module: " + this.name);
	},
	
	getDom: function() {
		//For each call in call_history
		for (var i = 0; i < this.call_history.length; i++) {
			//Check if call is older than maximumEntrieDistance
			if ( moment(moment()).diff(moment(this.call_history[i].time)) > this.config.maximumEntrieDistance * 60000 ){
				//is older -> remove from list
				this.call_history.splice(i, 1);
		}
	}
		//get latest x calls configured by maximumEntries
		var calls = this.call_history.slice(this.call_history.length - this.config.maximumEntries, this.call_history.length);
		
		//Create table
		var wrapper = document.createElement("table");
		//set table style
		wrapper.className = "small";
		
		//If there are no calls, set "noCall" text.
		if (calls.length === 0) {
			wrapper.innerHTML = this.translate("noCall");
			wrapper.className = "xsmall dimmed";
			return wrapper;
		}
		
		//For each call in calls
		for (var i = 0; i < calls.length; i++) {
			
			//Create callWrapper
			var callWrapper = document.createElement("tr");
			callWrapper.className = "normal";
			
			//Set caller of row
			var caller =  document.createElement("td");
			caller.innerHTML = calls[i].caller;
			caller.className = "title bright";
			callWrapper.appendChild(caller);
			
			//Set time of row
			var time =  document.createElement("td");
			time.innerHTML = moment(calls[i].time).fromNow();
			time.className = "time light xsmall";
			callWrapper.appendChild(time);

			//Add to wrapper
			wrapper.appendChild(callWrapper);
			
			
			// Create fade effect by MichMich (MIT)
			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = calls.length * this.config.fadePoint;
				var steps = calls.length - startingPoint;
				if (i >= startingPoint) {
					var currentStep = i - startingPoint;
					callWrapper.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
			// End Create fade effect by MichMich (MIT)
		}
		return wrapper;
	}

});