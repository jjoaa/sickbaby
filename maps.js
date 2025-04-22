//지도 초기화
let mapContainer = document.getElementById('map'), 
    mapOption = {
        center: new kakao.maps.LatLng(33.450701, 126.570667), 
        level: 3 
    };
let map = new kakao.maps.Map(mapContainer, mapOption);
let geocoder = new kakao.maps.services.Geocoder();
let bounds = new kakao.maps.LatLngBounds(); 
let redmarker;
let markers = []; // 마커 배열로 초기화
let infowindows = []; // 인포윈도우도 배열로 초기화
let lat;
let lon;

// 검색
function first(){
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

//공공 API
const api = 'B551182/spclMdlrtHospInfoService1/getChildNightMdlrtList1';
const auth = window.env.PUBLIC_DATA_API_KEY;
const urlBase = 'https://apis.data.go.kr/' + api + '?serviceKey=' + auth +'&numOfRows='+30;


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
