const zeroPad = (num, places) => String(num).padStart(places, '0')
function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}
var daysInCurrentMonth = 28;

$(document).ready(function(){

    // Initialize start date as toda'ys date
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    let stringDate = year + '-' + zeroPad(month,2) + '-' + zeroPad(day,2); 
    $('#startDate').val(stringDate);
    trip.startDate = dateObj;
    OnDateWasChanged();    
   
    let firstTime = true; // for page load only
    ajax.LoadAll(firstTime);
    
    console.log("l?");

    $('#loadTrips').on('click',function(){
        ajax.LoadAll();
        $('#savedTrips').show();
        $('html').css('overflow-y','hidden').css('background-color','gray');
    })

    $(document).on('click', '.loadTrip', function() {
        ajax.Load($(this).attr('trip_name'));
    });
    $(document).on('click', '.deleteTrip', function() {
        let trip_name = $(this).attr('trip_name');
        event.preventDefault();
        if (window.confirm("Are you sure (delete "+trip_name+")?")) {
            ajax.Delete(trip_name);
        }
    });

    $('#closeTrips').on('click',function(){
        $('#savedTrips').hide();
        $('html').css('overflow-y','scroll').css('background-color','white');
    });


    $('#save').on('click',function(e){
        ajax.PreSaveNameCheck();
    });


    // Add city
    $('#addCity').on('click',function(){
       var newCity= Object.assign({}, city)
       trip.cities.push(newCity);
       UpdateCalendar();
       UpdateGUI(trip);

    });

    $(document).on('click', '.deleteCity', function() {
        let rowToDelete = $(this).parent().parent().index();
        trip.cities.splice(rowToDelete,1);
        UpdateCalendar();
        UpdateGUI(trip);
        // $(this).closest('tr').remove();
        
      //code here ....
    });

    $(document).on('keyup change', 'input', function() {

        if ($(this).attr('id') === "tripName") {
            trip.name = $(this).val();
        }

        // DATE CHANGE 
        if ($(this).attr('id') === "startDate") {
            OnDateWasChanged(); 
       }

        if ($(this).attr('id') === "monthStartDate") {
            let date = $(this).val();
            trip.monthStartDate = parseInt(date);
            UpdateCalendar()
        }


        if ($(this).attr('class') === "city"){
            let row = $(this).closest('tr').index();
            trip.cities[row].name = $(this).val();             
            UpdateCalendar();
        }
        if ($(this).attr('class') === "numDays"){
            let row = $(this).closest('tr').index();
            trip.cities[row].days = parseInt($(this).val());   
            UpdateCalendar();
        }
    //    console.log('ch:'+$(this).val());
    });

    $(document).on('click', '.up', function() {
        let row = $(this).closest('tr').index();
        let a = trip.cities[row];
        let b = trip.cities[row-1];
        trip.cities[row] = b;
        trip.cities[row-1] = a;
        UpdateCalendar();
        UpdateGUI(trip);
    });

    $(document).on('click', '.down', function() {
        let row = $(this).closest('tr').index();
        let a = trip.cities[row];
        let b = trip.cities[row+1];
        trip.cities[row] = b;
        trip.cities[row+1] = a;
        UpdateCalendar();
        UpdateGUI(trip);
    });


});

function OnDateWasChanged(){
    // YEAR - MONTH - DAY
    var parts =$('#startDate').val().split('-');
    // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
    // January - 0, February - 1, etc.
    let year = parts[0];
    let month = parts[1];
    let day = parts[2];
    let tripStartDate = new Date(year,month-1,day);
    trip.startDay = parseInt(day); // only need the integer start date here
    trip.startDate = tripStartDate;
    let firstDayOfMonth = new Date(year,month-1,1);

    // Move the first day of month to the appropriate day of week column
    let dayOfWeek = firstDayOfMonth.getDay(); // 0 => Sunday, 1 => monday, 6 => Saturday
    trip.monthStartDate = parseInt(dayOfWeek); 

    // Fill the month to the appropriate # days for that month
    daysInCurrentMonth = daysInMonth(month,year);
    UpdateCalendar()


}

var ajax ={ 
    LoadAll(firstTime = false){
        $.ajax({
            type: 'POST',
            url: "/load_all",
            headers: {
                "X-CSRFToken" : csrf,
                "Content-Type": "application/json"
            },
            success: function (e) {
                $('#savedTripsList').html('');
                let firstTripLoaded = false;
                for (var trip in e.data){
                    let tripName = e.data[trip].trip_name;
                    if (!firstTripLoaded && firstTime){
                        firstTripLoaded = true;
                        ajax.Load(tripName);
                    }
                    trip_data = JSON.parse(e.data[trip].trip_json);
                    let cities = [];
                    for (c in trip_data.cities) { 
                        let cityName = trip_data.cities[c].name;
                        let days =trip_data.cities[c].days;
                        let daysText = days == 1 ? "day" : "days";
                        cities.push(cityName+" ("+days+" " +daysText+")"); 
                    }
                    let citiesText = cities.join(", ")
                    let startDate = new Date(trip_data.startDate).toISOString().split('T')[0];
                    $('#savedTripsList').append("<li>"+
                        "<h3>"+tripName+"</h3>"+
                        "Start:"+startDate+
                        "<br> Cities: "+ citiesText +
                        "<div class='buttons'>"+
                            "<button class='loadTrip' trip_name='"+tripName+"'>"+"Load</button> " +
                            "<button class='deleteTrip' trip_name='"+tripName+"'>"+"Delete</button> " +
                        "</div>" +
                        "</li>");

                }
                $('#numSavedTrips').text(e.data.length)
                if (e.data.length > 0) $('#loadTrips').show();
                else $('#loadTrips').hide();
            },
            error: function (e) {
                console.log("error:"+JSON.stringify(e));
            },
        });

    },
    Load(trip_name){
     
        $.ajax({
            type: 'POST',
            url: "/load",
            data : JSON.stringify({ trip_name : trip_name }),
            headers: {
                "X-CSRFToken" : csrf,
                "Content-Type": "application/json"
            },
            success: function (e) {
                $('#savedTrips').hide();
                $('html').css('overflow-y','scroll').css('background-color','white');

                let tripJson = JSON.parse(e.trip_json);
                trip = tripJson;
                trip.startDate = new Date(trip.startDate);
                UpdateGUI(trip);
                UpdateCalendar();
                ShowMessage("Loaded "+trip.name);
            },
            error: function (e) {
                console.log("error:"+JSON.stringify(e));
            },
        });

    },
    PreSaveNameCheck(){
        $.ajax({
            type: 'POST',
            url: "/preSaveNameCheck",
            headers: {
                "X-CSRFToken" : csrf,
                "Content-Type": "application/json"
            },
            data : JSON.stringify({ trip_name : trip.name, trip_json : JSON.stringify(trip) }),
            success: function (e) {
                  // console.log('name check success:'+JSON.stringify(e).trim(0,200));
                  name_exists = e["name_exists"];
                  // console.log("Name exists:"+name_exists);
                  user_exists = e["user_exists"];
                  if (name_exists && window.confirm("Name "+trip.name+" exists! Overwrite? ")){
                    ajax.Save();
                  } else if (!user_exists) {
                    alert("You need to log in before you can save a trip.");
                  } else if (!name_exists) {
                    // console.log("Name "+trip.name+" did not exist, saving new.");
                    ajax.Save();
                  } else {
                    ShowMessage("Save canceled!");
                  }
            },
            error: function (e) {
                console.log("setting save err: "+ JSON.stringify(e).trim(0,200));
//                $('html').html(JSON.stringify(e));
            },
        });
    
    },
    Save(){
        if (trip.cities.length == 0) {
            alert('You have no cities. Add a city before saving a trip');  
            ShowMessage("Save canceled (no cities!)");
            return;
        
        }
        

        $.ajax({
            type: 'POST',
            url: "/save",
            headers: {
                "X-CSRFToken" : csrf,
                "Content-Type": "application/json"
            },
            data : JSON.stringify({ trip_name : trip.name, trip_json : JSON.stringify(trip) }),
            success: function (e) {
                ShowMessage(trip.name+" saved!");
                let numTrips = e['total_trips'];
                $('#numSavedTrips').text(numTrips)
                if (numTrips > 0) $('#loadTrips').show();
            },
            error: function (e) {
                console.log("setting save err: "+ JSON.stringify(e).trim(0,200));
            },
        });
        event.preventDefault();
    },
    Delete(trip_name){
        $.ajax({
            type: 'POST',
            url: "/delete",
            headers: {
                "X-CSRFToken" : csrf,
                "Content-Type": "application/json"
            },
            data : JSON.stringify({ trip_name : trip_name }),
            success: function (e) {
                  //$('div[
                  ajax.LoadAll();
            },
            error: function (e) {
                console.log("setting save err: "+ JSON.stringify(e).trim(0,200));
//                $('html').html(JSON.stringify(e));
            },
        });
        event.preventDefault();
    },
}



var city = {
    name : "new city",
    days : 1
}

var cityHtml = '<tr><td><button class="deleteCity">Remove</button></td><td><input type="text" class="city"></td><td><input class="numDays" type="number" value="1" min="1"></td><td><div class="up">^</div><div class="down">v</div></tr> ';


var trip = {
    name : "My Trip",
    monthStartDate : 0,
    startDay : null, //Date(), // returns the current local day
    startDate : null,
    cities : [
    ],
}

var tripUtils = {
    getColorForCity(i) {
        return "hsl("+i*40+",20%,50%)";
    }
}


function UpdateGUI(tripData){
    // After loading the trip from the server, we need to update the trip inputs to match it
    
    $('#cities').html(''); // Clear all cities
    $('#tripName').val(tripData.name); 
    // set start date
    var month = trip.startDate.getUTCMonth() + 1; //months from 1-12
    var day = trip.startDate.getUTCDate();
    var year = trip.startDate.getUTCFullYear();
    let stringDate = year + '-' + zeroPad(month,2) + '-' + zeroPad(day,2); 
    $('#startDate').val(stringDate);
 

    // Populate cities from trip data
    for(var i=0;i<tripData.cities.length;i++){
        let thisCity = tripData.cities[i];
        let newCity = $(cityHtml);
        $('#cities').append(cityHtml);
        $('#cities tr:eq('+(i)+')').find('.city').val(thisCity.name)
        $('#cities tr:eq('+(i)+')').find('.numDays').val(thisCity.days)
        if (i == 0) {
            $('#cities tr:eq('+(i)+')').find('.up').addClass('disabled');
        }
        if (i == tripData.cities.length - 1){
            $('#cities tr:eq('+(i)+')').find('.down').addClass('disabled');

        }
    }

    
} 

function UpdateCalendar(){

    // Repaint empty calendar
    $('.calendar').text('');

    // Add first month
    let monthString = trip.startDate.toLocaleString('default', { month: 'long' });
    $('.calendar').append('<div class="monthTitle">'+monthString+"</div>");
    for(let i=0; i<trip.monthStartDate; i++){
        $('.calendar').append($('<div class="box"></div>'));
        
    }
    for (var i = 1; i < daysInCurrentMonth+1; i++) {
        $('.calendar').append($('<div class="box" id="box'+i+'"><div class="num">'+i+'</div><div class="city"></div></div>'));
    }

    // Add second month if needed
    let tripLength = 0;
    trip.cities.forEach(x => tripLength += x.days);
    if (tripLength > daysInCurrentMonth - trip.startDay){

        // Add month
        let tempDate = new Date(trip.startDate.getTime());
        tempDate.setMonth(tempDate.getMonth() + 1); // next month
        let monthString = tempDate.toLocaleString('default', { month: 'long' });
        $('.calendar').append('<div class="monthTitle">'+monthString+"</div>");
        for(let i=0; i<trip.monthStartDate; i++){
            $('.calendar').append($('<div class="box"></div>'));
            
        }
        let daysInNextMonth = daysInMonth(tempDate.getMonth()+1,tempDate.getYear())
        ;for (var i = 1; i < daysInNextMonth+1; i++) {
            $('.calendar').append($('<div class="box" id="box'+i+'"><div class="num">'+i+'</div><div class="city"></div></div>'));
        }

         
    }


    $('.box').css('background','#e0e0e0');
    $('#box'+trip.startDay).css('background','#abc');
    $('.box').each(function(){
        $(this).find('.city').text('');
    })
    var days = 0;
    for(let i=0;i<trip.cities.length;i++){
        let day = days + trip.startDay;
        let cityName = trip.cities[i].name;
        $('#box'+day).find('.city').text(cityName);

        let cityStartDate = trip.startDay + days;
        // color the boxes
        
        for (let j=cityStartDate;j<cityStartDate+trip.cities[i].days;j++){
            let color = tripUtils.getColorForCity(i);
            $('#box'+j).css('background',color);
        }
        days += trip.cities[i].days;
    }

}

function ShowMessage(text){
    $('#saveResult').stop().css('opacity',1).text(text).fadeOut(5500);

}
