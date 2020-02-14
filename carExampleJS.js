
/*
   {
    "cars": {
        "Nissan": {
            "Sentra": {"doors":4, "transmission":"automatic"},
            "Maxima": {"doors":4, "transmission":"automatic"}
        },
        "Ford": {
            "Taurus": {"doors":4, "transmission":"automatic"},
            "Escort": {"doors":4, "transmission":"automatic"}
        }
    }
}

data.cars['Nissan']['Sentra'].doors   // 4
data.cars['Nissan']['Maxima'].doors   // 4
data.cars['Nissan']['Maxima'].transmission   // automatic

for (var make in data.cars) {
    for (var model in data.cars[make]) {
        var doors = data.cars[make][model].doors;
        alert(make + ', ' + model + ', ' + doors);
    }
}
// creates json from an array object with json data
var jsonCars = JSON.stringify(cars);
*/
