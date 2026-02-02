const numPetals = 40; // số cánh hoa
for(let i=0; i<numPetals; i++){
  const petal = document.createElement('div');
  petal.classList.add('petal');

  // vị trí ngang ngẫu nhiên
  petal.style.left = Math.random() * window.innerWidth + 'px';
  // kích thước khác nhau
  const size = 8 + Math.random() * 12; 
  petal.style.width = size + 'px';
  petal.style.height = size + 'px';
  // thời gian rơi khác nhau
  petal.style.animationDuration = 4 + Math.random() * 6 + 's';
  // delay khác nhau để tự nhiên
  petal.style.animationDelay = Math.random() * 5 + 's';

  document.body.appendChild(petal);
}

