$(document).ready(function() {
    $(btn).on('click', function(){
        var files = $('#video_input')[0].files;
        var no_files = files.length;
        $('#video_display').empty();
        for(var i=0; i<no_files; i++){
            var div = document.createElement('div');
            div.id = "video_box" + i;
            div.classList.add('video_row');

            var video_preview = document.createElement('div');
            video_preview.classList.add('preview');
            var video = document.createElement('video');
            video.autoplay = true;
            video.width = "640";
            video.height = "480";
            video.muted = "muted";
            video.id = "video_play_" + i;
            var source = document.createElement('source');
            source.src = window.URL.createObjectURL(files[i]);

            video.appendChild(source);
            video_preview.appendChild(video);

            var image_preview = document.createElement('div');
            image_preview.classList.add('preview');
            image_preview.id = 'img_preview_' + i;

            div.appendChild(video_preview);
            div.appendChild(image_preview);

            $('#video_display').append(div);
            $('#video_display').append('<hr>');

            video.addEventListener('loadeddata', function(evt){
                send_request(this.id.split('_')[2]);
            });
        }
    });

    async function send_request(index){
        var video = $('#video_play_' + index)[0];
        var image_preview = $('#img_preview_' + index);
        image_preview.empty();
        var image = document.createElement('img');
        image.id = 'image_' + index;
        image.classList.add('image_img');
        image_preview[0].appendChild(image);

        var loadSymbol = document.createElement('img');
        loadSymbol.id='loading_'+index;
        loadSymbol.src='/static/loading.gif';
        loadSymbol.style.paddingTop="30%";
        image_preview[0].appendChild(loadSymbol);

        var canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        var blob = await new Promise(resolve => canvas.toBlob(resolve));
        var url = window.URL.createObjectURL(blob);
        image.src = url;
        image.style.display="none";

        var form = new FormData();
        form.append('myfile', blob);
        postData(form, index);
    }

    function postData(form, index){
        $.ajax({
            "url": 'https://gae-cloud-app.uc.r.appspot.com/upload',
            "data": form,
            "processData": false,
            "crossDomain": true,
            "contentType": false,
            "type": 'POST',
            "success": function(data){
                var image = document.getElementById("image_"+index);
                image.style.display="flex";
                image.style.position="absolute";
                var load_symbol = document.getElementById("loading_"+index);
                load_symbol.style.display="none";
                process_response(data, index);
            }, 
            "error": function(error, textStatus, errorText){
                console.log(errorText);
                postData(form, index);
            }});
    }

    async function process_response(data, index){
        console.log(data, index);
        var jsonData = data;
        var labels = jsonData['labels'];
        var scores = jsonData['scores'];
        var boxes = jsonData['boxes'];
        var image_preview = $('#img_preview_' + index);
        var image = $('#image_' + index)[0];
        var x_factor = image.clientWidth/ image.naturalWidth;
        var y_factor = image.clientHeight/ image.naturalHeight;
        console.log(x_factor, y_factor);
        for(var i=0; i<labels.length; i++){
            if(scores[i] >= 0.5){
                var box = document.createElement('div');
                box.classList.add('status_box');
                box.style.top = boxes[i][1] * y_factor;
                box.style.left = boxes[i][0] * x_factor;
                box.style.width = (boxes[i][2] - boxes[i][0]) * x_factor;
                box.style.height = (boxes[i][3] - boxes[i][1]) * y_factor;
                if(labels[i] == 1){
                    box.classList.add('box_ok');
                }else if(labels[i] == 2){ 
                    box.classList.add('box_not_ok');
                }else{
                    box.classList.add('box_adjust');
                }
                image_preview[0].appendChild(box);
            }
        }

        setTimeout(function(){
            send_request(index);
        }, 4000);
    }
});