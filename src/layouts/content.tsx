import React from "react";
import styled from "styled-components";
export const Container = styled.div`
  max-width: 1440px;
  align-items: center;
  display: flex;
  justify-content: center;
  @media screen and (max-width: 1000px) {
    display: grid;
  }
`;
const Content: React.FC = ({ children }) => {
  return <Container>{children}</Container>;
};

export default Content;
