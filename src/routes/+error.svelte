<script>
    $:timer = 4;

    for(let i = 0; i < 4; i++){
        setTimeout(() => {
            timer--;
        }, i * 1000);
    }
    setTimeout(() => {
        window.location.href = '/';
    }, 4000);
</script>

<div class="error">
    <div>
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>Sorry, but the page you were trying to view does not exist.</p>
        <p><mark>You will be redirected to main page in {timer}</mark></p>
    </div>
</div>

<style>
    .error{
        display: grid;
        place-items: center;
        height: 100vh;
        width: 100vw;
    }
</style>