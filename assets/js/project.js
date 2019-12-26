$(function(){
	$(".btn-category").click(function(){
		console.log("click")
		$.ajax({
			type:"post",
			data:$("#category_form").serialize(),
			url:"/category-action",
			success:function(ans){
				console.log(ans)
					
				$(".message").html(ans)

			}
		})
	})
})