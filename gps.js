//공공 API
const api = 'B551182/spclMdlrtHospInfoService1/getChildNightMdlrtList1';
const auth = window.env.PUBLIC_DATA_API_KEY;
const urlBase = 'https://apis.data.go.kr/' + api + '?serviceKey=' + auth +'&numOfRows='+30;

//지도 초기화
let mapContainer = document.getElementById('map'), 
    mapOption = {
        center: new kakao.maps.LatLng(33.450701, 126.570667), 
        level: 3 
    };
let map = new kakao.maps.Map(mapContainer, mapOption);
let geocoder = new kakao.maps.services.Geocoder();
let bounds = new kakao.maps.LatLngBounds(); 
let markers = []; // 마커 배열로 초기화
let infowindows = []; // 인포윈도우도 배열로 초기화
let  redmarker;
function AreaCode(sigu, sido) {

    let urls = [];  
    let url ='';
    let DB='';

    if (sigu === '경기') {
        DB = DBGg;
        for (let i = 0; i < DB[sido].length; i++) {
            url = urlBase+'&sgguCd=' + DB[sido][i];
            urls.push(url); 
        }
    }
    else if (sigu ==='서울') {
        DB = DBSeoul;
        url = urlBase + '&sgguCd=' + DB[sido];
        urls.push(url);
        
    } else {
        DB = DBArea;
        url =  urlBase +'&sidoCd='+ DB[sigu];
        urls.push(url);
    }

    return urls; 
}

//거리계산 함수
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름(km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // 위치 기준 인접 행정구 찾는 함수 
  function getNearbyDistricts(location, rangeKm) { 
    let nearby = [];
    for (let [name, pos] of Object.entries(districts)) {
      const distance = getDistance(location.lat, location.lng, pos.lat, pos.lng);
      if (distance <= rangeKm) {
        nearby.push(name);
      }
    }
    return nearby;
  }


  function requestNearbyHospitals(userLocation) {
    const nearbyDistricts = getNearbyDistricts(userLocation, 3); // 반경 3km

    if (nearbyDistricts.length === 0) {
        console.log("근처 행정구가 없습니다.");
        return;
    }

    let dataFound = false; // 병원 데이터가 있는지 체크하는 변수

    // 인접 행정구를 차례대로 확인하면서 요청
    for (let district of nearbyDistricts) {
        
        let region = '서울'; // 기본값
        if (DBGg[district]) region = '경기';

       // console.log(`${region}, ${district}`); 서울구로 서울금천 경기광명
        
        // 병원 데이터 요청
        sendUrl_map(region, district)
            .then((data) => {
                // 병원 데이터가 있으면
                if (data && data.length > 0) {
                    console.log(`${district}에서 병원 데이터를 찾았습니다.`);
                    dataFound = true; // 병원 데이터 발견
                   
                }
            })
            .catch((error) => {
                console.error(`${district}에서 병원 데이터 요청 중 오류 발생:`, error);
            });
        
        // 만약 병원 데이터가 발견되었다면 더 이상 요청하지 않음
        if (dataFound) {
            break;
        }
    }

    // 병원 데이터를 찾지 못한 경우
    if (!dataFound) {
        console.log("인접 구역에서 병원 데이터를 찾을 수 없습니다.");
        //document.getElementById("noData").style.display = "block";
    }
}

// 병원 데이터를 가져오는 함수
let sendUrl_map = function(sigu, sido) {

    const urls = AreaCode(sigu, sido);
    
    return new Promise((resolve, reject) => {
        if (urls.length === 0) {
            // 요청할 URL이 없으면 함수 종료
            console.log('URL 목록이 비어있습니다.');
            reject('URL 목록이 없습니다.');
            return;
        }
        
        // 병원 데이터를 저장할 배열
        let allHospitals = []; 

        // 모든 URL에 대해 데이터를 요청하고 병원 리스트를 합침
        Promise.all(urls.map((url) => {
            return axios.get(url)
                .then((res) => {
                    console.log(sido,urls);
                    const apiList = res.data.response.body.items.item; 

                    // 병원 리스트가 배열인지 확인
                    if (Array.isArray(apiList)) {
                        allHospitals = allHospitals.concat(apiList);
                    }
                })
                .catch((error) => {
                    console.error('API 요청 중 오류가 발생했습니다: ', error);
                    return [];
                });
        })).then(() => {
            // 병원 데이터가 있으면 지도에 마커 표시
            if (allHospitals.length > 0) {
                document.getElementById("map").style.display = "block";
                document.getElementById("noGps").style.display = "block"; 

                let positions = allHospitals.map(function(hospital) {
                    return {
                        name: hospital.yadmNm,
                        address: hospital.addr
                    };
                });

                // 지도에 병원 마커 표시
                positions.forEach((position) => {
                    map.relayout();

                    // 주소를 좌표로 변환
                    geocoder.addressSearch(position.address.split(',', 1), function(result, status) {
                        if (status === kakao.maps.services.Status.OK) {
                            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

                            // 마커 생성
                            let marker = new kakao.maps.Marker({
                                map: map,
                                position: coords,
                            });
                            markers.push(marker);

                            // 인포윈도우 생성
                            let infowindow = new kakao.maps.InfoWindow({
                                content: '<div style="width:150px;text-align:center;padding:6px 0;">' + position.name + '</div>'
                            });
                            infowindows.push(infowindow);
                            infowindow.open(map, marker);

                            // 좌표를 맵의 범위에 추가
                            bounds.extend(coords);
                            map.setBounds(bounds); 
                        }
                    });
                });
                
            } else {
                console.log('병원 데이터가 없습니다.');

                document.getElementById("noGps").style.display = "block";  
                document.getElementById("map").style.display = "none";  
                showNoDataMessage(sido);
               
                
                console.log("데이터가 없습니다. 다른 URL을 시도 중...");
                console.log(lat,lon);
            }
        });
    });
};

function useGps(){  
    document.querySelector('img').style.display = 'none';
  
       
    // 기존 마커와 인포윈도우 제거
    removeMarker();

    bounds = new kakao.maps.LatLngBounds();
    
    // GPS 사용
    if (navigator.geolocation) {

       
        navigator.geolocation.getCurrentPosition((position) => {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;
        let locPosition = new kakao.maps.LatLng(lat, lng); 
            
            
        let icon = new kakao.maps.MarkerImage(
          "./images/gpsIcon.png",
           new kakao.maps.Size(40, 40)
       )
       
     redmarker = new kakao.maps.Marker({  
           map: map, 
           position: locPosition,
           image : icon
       }); 
      
       redmarker.setImage(icon);

        // 현재 좌표로 인접 구 검색
        requestNearbyHospitals({ lat, lng });
        geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
        });
    } else { //GPS 사용할 수 없을 경우
        
        // document.getElementById("noGps").style.display = "block";  
        sendUrl_map(sigu, sido);  
    }
}


// 마커와 인포윈도우를 모두 제거하는 함수
function removeMarker() {
    // 모든 마커 제거
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }   
    markers = [];

    // 모든 인포윈도우 닫기
    for (let i = 0; i < infowindows.length; i++) {
        infowindows[i].close();
    }
    infowindows = [];
    
    // 현재 위치 마커(redmarker)가 있으면 제거
    if (redmarker) {
        redmarker.setMap(null);
        redmarker = null;
    }
}


// 검색버튼
function maps(){
    const citySelect = document.getElementById("city");
    const districtSelect = document.getElementById("district");

    const selectedCity = citySelect.value;
    const selectedDistrict = districtSelect.value;

    let sigu = selectedCity;  
    let sido = selectedDistrict ? selectedDistrict : ''; 

    // 기존 마커와 인포윈도우 제거
    removeMarker();
    bounds = new kakao.maps.LatLngBounds();
   
    //url 전송
    sendUrl_map(sigu, sido);
    document.getElementById("noData").style.display = "none"; 
}

//
function showNoDataMessage(district) {
    // "noData" div를 찾아서 표시하도록 설정
    const noDataDiv = document.getElementById('noData');
    
    // "districtName" span을 찾아서 지역명 업데이트
    const districtName = document.getElementById('districtName');
    districtName.innerHTML = district;  // 동적으로 지역명 삽입

    // "noData" div를 보이게 설정
    noDataDiv.style.display = 'block'; 
}